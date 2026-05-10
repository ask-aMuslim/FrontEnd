import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, forkJoin, from } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay, take, filter, finalize } from 'rxjs/operators';
import {
    StudentProgress,
    StageProgress,
    CourseProgress,
    LessonProgress,
    RecentLessonInfo,
    UpdateLessonProgressRequest,
    SubmitQuizResultRequest,
    StageQuizResult,
    AcademyCourse,
    AcademyLesson,
    AcademyLessonType,
    AcademyStageApi,
    CourseStatus,
    LessonStatus,
} from '../models/interfaces/academy-progress.model';
import {
    CourseProgressSummaryDto,
    ProgressFacade,
    ProgressReadDto,
} from '../../api/facades/progress.facade';
import { LessonProgressFacade } from '../../api/facades/lesson-progress.facade';
import { LessonFacade, LessonReadDto } from '../../api/facades/lesson.facade';
import { CourseFacade, CourseReadDto, RoadmapCourseDto } from '../../api/facades/course.facade';
import { LevelFacade, LevelReadDto } from '../../api/facades/level.facade';
import { StudentFacade, StudentProfile } from '../../api/facades/student.facade';
import { EnrollmentFacade, EnrollmentReadDto } from '../../api/facades/enrollment.facade';
import { QuizFacade, QuizReadDto } from '../../api/facades/quiz.facade';
import { EnrollmentStatus } from '../models/interfaces/enums.model';
import { toApiMediaUrl } from '../helpers/media-url.helper';
import { environment } from '../../../environments/environment';
import {
    extractVideoId,
    fetchVideoDuration,
    formatDuration,
    renderDuration,
} from '../helpers/youtube-duration.helper';

interface RecentLessonVisitSnapshot {
    courseId: string;
    lessonId: string;
    visitedAt: string;
    lessonType?: AcademyLessonType;
    lessonNumber?: number;
    lessonTitle?: string;
    currentTimeSeconds?: number;
    totalTimeSeconds?: number;
    progressPercentage?: number;
}

export interface RememberRecentLessonVisitRequest {
    courseId: string;
    lessonId: string;
    lessonType?: AcademyLessonType;
    lessonNumber?: number;
    lessonTitle?: string;
    currentTimeSeconds?: number;
    totalTimeSeconds?: number;
    progressPercentage?: number;
}

export interface CourseEnrollmentState {
    enrollmentId: string | null;
    status: EnrollmentStatus | null;
    isEnrolled: boolean;
    isCompleted: boolean;
}

/**
 * Academy Progress Service
 *
 * Manages student progress through the academy including:
 * - Stage unlock status (unlocked after passing stage quiz)
 * - Course completion tracking
 * - Lesson progress tracking
 * - Recent lesson for "Continue Learning" feature
 *
 * Integration Strategy:
 * - LevelFacade: Fetch real stages from GET /api/Levels
 * - CourseFacade: Fetch courses per level from GET /api/Courses?LevelId=&IsPublished=true
 * - EnrollmentFacade: Student-course linkage
 * - LessonFacade: Lesson list and basic lesson writes
 * - StudentFacade: Current student identity
 *
 * This service is API-first and avoids static/mock academy data.
 */
@Injectable({
    providedIn: 'root',
})
export class AcademyProgressService {
    private static readonly localCompletedLessonsPrefix = 'aam_course_completed_lessons_';
    private static readonly localQuizPassedPrefix = 'aam_course_quiz_passed_';
    private static readonly localVideoCompletedPrefix = 'video-completed-';
    private static readonly localRecentLessonKey = 'aam_recent_lesson_visit';

    private readonly progressFacade = inject(ProgressFacade);
    private readonly lessonProgressFacade = inject(LessonProgressFacade);
    private readonly lessonFacade = inject(LessonFacade);
    private readonly courseFacade = inject(CourseFacade);
    private readonly levelFacade = inject(LevelFacade);
    private readonly studentFacade = inject(StudentFacade);
    private readonly enrollmentFacade = inject(EnrollmentFacade);
    private readonly quizFacade = inject(QuizFacade);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    private readonly progressSubject = new BehaviorSubject<StudentProgress | null>(null);
    private isProgressInitialized = false;

    get progress$(): Observable<StudentProgress | null> {
        if (!this.isProgressInitialized && this.isBrowser) {
            this.isProgressInitialized = true;
            this.initializeProgress();
        }
        return this.progressSubject.asObservable();
    }

    private readonly isRefreshingProgressSubject = new BehaviorSubject<boolean>(false);
    readonly isRefreshingProgress$ = this.isRefreshingProgressSubject.asObservable();
    private academyCoursesCache: AcademyCourse[] = [];
    private academyStagesCache: AcademyStageApi[] = [];
    private academyStagesRequest$: Observable<AcademyStageApi[]> | null = null;
    private academyCoursesRequest$: Observable<AcademyCourse[]> | null = null;
    private studentProgressRequest$: Observable<StudentProgress> | null = null;
    private readonly lessonsCache = new Map<string, AcademyLesson[]>();
    private readonly standaloneQuizCountCache = new Map<string, number>();
    private readonly hasAnyQuizCache = new Map<string, boolean>();
    private readonly mediaDurationSecondsCache = new Map<string, number>();
    private readonly mediaDurationRequestCache = new Map<string, Observable<number>>();

    constructor() {}

    private initializeProgress(): void {
        this.getStudentProgress().subscribe({
            next: (progress) => this.progressSubject.next(progress),
            error: () => this.progressSubject.next(this.buildEmptyProgress()),
        });
    }

    /**
     * Get all academy stages from the real API.
     * Fetches from GET /api/Levels with published status.
     */
    getAcademyStages(forceRefresh = false): Observable<AcademyStageApi[]> {
        if (forceRefresh) {
            this.academyStagesCache = [];
            this.academyStagesRequest$ = null;
        }

        if (!forceRefresh && this.academyStagesCache.length > 0) {
            return of(this.academyStagesCache);
        }

        if (this.academyStagesRequest$) {
            return this.academyStagesRequest$;
        }

        this.academyStagesRequest$ = this.levelFacade.getAllLevels().pipe(
            map(levels => levels
                .filter(l => l.isPublished !== false) // include all unless explicitly not published
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((level, index) => this.mapLevelToStage(level, index + 1))
            ),
            tap(stages => { this.academyStagesCache = stages; }),
            catchError(() => of([])),
            shareReplay(1)
        );

        return this.academyStagesRequest$;
    }

    /**
     * Get complete student progress.
     * Builds progress from API-backed enrollments, courses, and lessons.
     */
    getStudentProgress(forceRefresh = false): Observable<StudentProgress> {
        if (forceRefresh) {
            this.studentProgressRequest$ = null;
        }

        if (this.studentProgressRequest$) {
            return this.studentProgressRequest$;
        }

        this.studentProgressRequest$ = this.getAcademyCourses().pipe(
            switchMap(courses =>
                this.studentFacade.me().pipe(
                    switchMap(student => this.buildProgressForStudent(courses, this.resolveStudentId(student))),
                    catchError(() =>
                        of(this.buildStudentProgress('anonymous', courses, new Map<string, EnrollmentReadDto>(), null, []))
                    )
                )
            ),
            tap(progress => this.progressSubject.next(progress)),
            shareReplay(1)
        );

        return this.studentProgressRequest$;
    }

    private buildProgressForStudent(courses: AcademyCourse[], studentId?: string): Observable<StudentProgress> {
        if (!studentId) {
            return of(this.buildStudentProgress('anonymous', courses, new Map<string, EnrollmentReadDto>(), null, []));
        }

        return forkJoin({
            enrollmentRecordsByCourseId: this.getEnrollmentRecordsByCourseId(studentId),
            progressRecords: this.getCourseProgressRecords(courses),
        }).pipe(
            switchMap(({ enrollmentRecordsByCourseId, progressRecords }) =>
                this.resolveRecentLesson(courses, this.toEnrolledCourseIds(enrollmentRecordsByCourseId), progressRecords).pipe(
                    map((recentLesson) => this.buildStudentProgress(
                        studentId,
                        courses,
                        enrollmentRecordsByCourseId,
                        recentLesson,
                        progressRecords,
                    )),
                ),
            ),
            catchError(() =>
                of(this.buildStudentProgress(studentId, courses, new Map<string, EnrollmentReadDto>(), null, []))
            ),
        );
    }

    private getCourseProgressRecords(courses: AcademyCourse[]): Observable<ProgressReadDto[]> {
        if (courses.length === 0) {
            return of([]);
        }

        return forkJoin(
            courses.map((course) =>
                this.progressFacade.getCourseProgress(course.id).pipe(
                    map((summary) => this.mapCourseSummaryToProgressRecord(course.id, summary)),
                    catchError(() => of(null)),
                ),
            ),
        ).pipe(
            map((records) => records.filter((record): record is ProgressReadDto => record !== null)),
        );
    }

    private mapCourseSummaryToProgressRecord(
        courseId: string,
        summary: CourseProgressSummaryDto | null,
    ): ProgressReadDto | null {
        if (!summary) {
            return null;
        }

        const completedLessonsCount =
            typeof summary.completedLessonsCount === 'number'
                ? Math.max(0, summary.completedLessonsCount)
                : undefined;
        const progressPercentage =
            typeof summary.progressPercentage === 'number'
                ? this.normalizeProgressPercentage(summary.progressPercentage)
                : undefined;
        const isCompleted =
            summary.isCompleted === true
            || (
                typeof summary.totalLessonsCount === 'number'
                && summary.totalLessonsCount > 0
                && typeof completedLessonsCount === 'number'
                && completedLessonsCount >= summary.totalLessonsCount
            );

        if (
            completedLessonsCount === undefined
            && progressPercentage === undefined
            && !isCompleted
        ) {
            return null;
        }

        return {
            courseId,
            totalLessonsCompleted: completedLessonsCount,
            lessonCompletionRate: progressPercentage,
            progress: progressPercentage,
            isCompleted,
            completedProgress: isCompleted,
        };
    }

    private getEnrollmentRecordsByCourseId(studentId: string): Observable<Map<string, EnrollmentReadDto>> {
        return this.enrollmentFacade.getEnrolledCoursesByStudent(studentId).pipe(
            map((enrollments) => {
                const enrollmentMap = new Map<string, EnrollmentReadDto>();

                for (const enrollment of enrollments) {
                    const courseId = typeof enrollment.courseId === 'string' ? enrollment.courseId : '';
                    if (!courseId) {
                        continue;
                    }

                    const existingEnrollment = enrollmentMap.get(courseId);
                    if (!existingEnrollment) {
                        enrollmentMap.set(courseId, enrollment);
                        continue;
                    }

                    const existingPriority = this.getEnrollmentStatusPriority(existingEnrollment.status);
                    const currentPriority = this.getEnrollmentStatusPriority(enrollment.status);
                    if (currentPriority >= existingPriority) {
                        enrollmentMap.set(courseId, enrollment);
                    }
                }

                return enrollmentMap;
            }),
            catchError(() => of(new Map<string, EnrollmentReadDto>())),
        );
    }

    private toEnrolledCourseIds(enrollmentRecordsByCourseId: Map<string, EnrollmentReadDto>): Set<string> {
        const enrolledCourseIds = new Set<string>();

        for (const [courseId, enrollment] of enrollmentRecordsByCourseId.entries()) {
            if (this.isEnrollmentConsideredEnrolled(enrollment.status)) {
                enrolledCourseIds.add(courseId);
            }
        }

        return enrolledCourseIds;
    }

    /**
     * Get recent lesson for "Continue Learning" button.
     * Derived from the full student progress response.
     */
    getRecentLesson(): Observable<RecentLessonInfo | null> {
        return this.progress$.pipe(
            filter((p): p is StudentProgress => p !== null),
            map((progress) => progress.recentLesson)
        );
    }

    /**
     * Get stage progress for all stages
     */
    getStageProgress(): Observable<StageProgress[]> {
        return this.progress$.pipe(
            filter((p): p is StudentProgress => p !== null),
            map((progress) => progress.stageProgress)
        );
    }

    /**
     * Check if a specific stage is unlocked
     */
    isStageUnlocked(stageNumber: number): Observable<boolean> {
        return this.progress$.pipe(
            filter((p): p is StudentProgress => p !== null),
            map((progress) => {
                const stage = progress.stageProgress.find((s) => s.stageNumber === stageNumber);
                return stage?.isUnlocked ?? false;
            })
        );
    }

    /**
     * Get course progress for a specific course
     */
    getCourseProgress(courseId: string): Observable<CourseProgress | undefined> {
        return this.progress$.pipe(
            filter((p): p is StudentProgress => p !== null),
            map((progress) => progress.courseProgress.find((c) => c.courseId === courseId))
        );
    }

    /**
     * Fetch progress for a single course directly without triggering global student progress state.
     */
    getTargetedCourseProgress(courseId: string): Observable<CourseProgress | undefined> {
        return this.progressFacade.getCourseProgress(courseId).pipe(
            map(summary => {
                if (!summary) return undefined;
                return {
                    courseId: courseId,
                    status: summary.isCompleted ? 'completed' : (summary.progressPercentage && summary.progressPercentage > 0 ? 'in-progress' : 'locked'),
                    progress: summary.progressPercentage ?? 0,
                    completedLessons: summary.completedLessonsCount ?? 0,
                    totalLessons: summary.totalLessonsCount ?? 0,
                    quizPassed: summary.isCompleted ?? false,
                } as CourseProgress;
            }),
            catchError(() => of(undefined))
        );
    }

    /**
     * Fetch targeted details for prerequisite courses (title and completion status)
     * without triggering global course or progress fetching.
     */
    getTargetedPrerequisiteDetails(courseIds: string[]): Observable<{ id: string, title: string, isCompleted: boolean }[]> {
        if (!courseIds || courseIds.length === 0) {
            return of([]);
        }

        const requests = courseIds.map(id =>
            forkJoin({
                course: this.courseFacade.getCourseById(id).pipe(catchError(() => of(null))),
                progress: this.getTargetedCourseProgress(id)
            }).pipe(
                map(({ course, progress }) => ({
                    id,
                    title: course?.title || 'Unknown Course',
                    isCompleted: progress?.status === 'completed'
                }))
            )
        );

        return forkJoin(requests);
    }

    getCurrentStudentCourseEnrollment(courseId: string): Observable<CourseEnrollmentState> {
        if (!courseId) {
            return of(this.createEmptyEnrollmentState());
        }

        return this.getCurrentStudentId().pipe(
            switchMap((studentId) => {
                if (!studentId) {
                    return of(this.createEmptyEnrollmentState());
                }

                return this.getEnrollmentRecordForStudentCourse(studentId, courseId).pipe(
                    map((enrollment) => this.resolveCourseEnrollmentState(enrollment)),
                    catchError(() => of(this.createEmptyEnrollmentState())),
                );
            }),
            catchError(() => of(this.createEmptyEnrollmentState())),
        );
    }

    enrollCurrentStudentInCourse(courseId: string): Observable<boolean> {
        if (!courseId) {
            return of(false);
        }

        return this.getCurrentStudentId().pipe(
            switchMap((studentId) => {
                if (!studentId) {
                    return of(false);
                }

                return this.getEnrollmentRecordForStudentCourse(studentId, courseId).pipe(
                    take(1),
                    switchMap((existingEnrollment) => {
                        const existingState = this.resolveCourseEnrollmentState(existingEnrollment);

                        if (existingState.isEnrolled) {
                            return of(true);
                        }

                        if (
                            existingEnrollment?.id
                            && existingState.status === EnrollmentStatus.Cancelled
                        ) {
                            return this.enrollmentFacade
                                .updateEnrollmentStatus(existingEnrollment.id, EnrollmentStatus.Active)
                                .pipe(
                                    tap((updated) => {
                                        if (updated) {
                                            this.invalidateProgressCache();
                                        }
                                    }),
                                    catchError(() => of(false)),
                                );
                        }

                        return this.enrollmentFacade
                            .createEnrollment({ studentId, courseId })
                            .pipe(
                                map(() => true),
                                tap(() => this.invalidateProgressCache()),
                                catchError(() => of(false)),
                            );
                    }),
                    catchError(() => of(false)),
                );
            }),
            catchError(() => of(false)),
        );
    }

    private getEnrollmentRecordForStudentCourse(
        studentId: string,
        courseId: string,
    ): Observable<EnrollmentReadDto | undefined> {
        if (!studentId || !courseId) {
            return of(undefined);
        }

        return this.enrollmentFacade.getStudentsEnrolledInCourse(courseId).pipe(
            map((enrollments) => this.selectEnrollmentForStudent(enrollments, studentId)),
            switchMap((enrollmentForStudent) => {
                if (enrollmentForStudent) {
                    return of(enrollmentForStudent);
                }

                return this.getEnrollmentRecordsByCourseId(studentId).pipe(
                    map((recordsByCourseId) => recordsByCourseId.get(courseId)),
                    catchError(() => of(undefined)),
                );
            }),
            catchError(() =>
                this.getEnrollmentRecordsByCourseId(studentId).pipe(
                    map((recordsByCourseId) => recordsByCourseId.get(courseId)),
                    catchError(() => of(undefined)),
                )
            ),
        );
    }

    private selectEnrollmentForStudent(
        enrollments: EnrollmentReadDto[],
        studentId: string,
    ): EnrollmentReadDto | undefined {
        const normalizedStudentId = studentId.trim().toLowerCase();
        if (!normalizedStudentId) {
            return undefined;
        }

        let selectedEnrollment: EnrollmentReadDto | undefined;
        let selectedPriority = -1;

        for (const enrollment of enrollments) {
            const enrollmentStudentId = typeof enrollment.studentId === 'string'
                ? enrollment.studentId.trim().toLowerCase()
                : '';

            if (!enrollmentStudentId || enrollmentStudentId !== normalizedStudentId) {
                continue;
            }

            const enrollmentPriority = this.getEnrollmentStatusPriority(enrollment.status);
            if (!selectedEnrollment || enrollmentPriority >= selectedPriority) {
                selectedEnrollment = enrollment;
                selectedPriority = enrollmentPriority;
            }
        }

        return selectedEnrollment;
    }

    /**
     * Get courses for a specific stage (level) and map with progress.
     * Accepts either a level UUID string OR a stage number (1-based index).
     * When a number is passed the cached stages are consulted to resolve the real levelId.
     */
    getStageCoursesWithProgress(stageId: string | number): Observable<(AcademyCourse & { progress: CourseProgress })[]> {
        const resolvedId$ = typeof stageId === 'string'
            ? of(stageId)
            : this.getAcademyStages().pipe(
                map(stages => {
                    const match = stages.find(s => s.number === stageId);
                    return match?.id ?? String(stageId);
                })
            );

        return resolvedId$.pipe(
            switchMap(levelId =>
                this.getStudentProgress().pipe(
                    switchMap((progress) =>
                        this.getAcademyCoursesByLevel(levelId).pipe(
                            map((courses) => this.attachProgressToCourses(courses, progress.courseProgress))
                        )
                    )
                )
            )
        );
    }

    /**
     * Get all academy courses with API data. Fetches all levels then all courses per level.
     */
    getAcademyCourses(forceRefresh = false): Observable<AcademyCourse[]> {
        if (forceRefresh) {
            this.academyCoursesCache = [];
            this.academyCoursesRequest$ = null;
            this.standaloneQuizCountCache.clear();
            this.hasAnyQuizCache.clear();
        }

        const useCache = !forceRefresh && this.academyCoursesCache.length > 0;
        if (useCache) {
            return of(this.academyCoursesCache);
        }

        if (this.academyCoursesRequest$) {
            return this.academyCoursesRequest$;
        }

        this.academyCoursesRequest$ = this.getAcademyStages().pipe(
            switchMap(stages => {
                if (stages.length === 0) {
                    // fallback to unfiltered course fetch if no levels yet
                    return this.courseFacade.getAllCourses().pipe(
                        map(courses => courses
                            .filter((course) => {
                                const isPublished = course['isPublished'];
                                return isPublished !== false;
                            })
                            .map(c => this.mapCourseDtoToAcademyCourse(c, undefined, 1))
                        )
                    );
                }
                const courseRequests = stages.map(stage =>
                    forkJoin({
                        coursesByLevel: this.courseFacade.getCoursesByLevel(stage.id).pipe(
                            catchError(() => of([] as CourseReadDto[])),
                        ),
                        roadmapCourses: this.courseFacade.getRoadmap(stage.id).pipe(
                            catchError(() => of([] as RoadmapCourseDto[])),
                        ),
                    }).pipe(
                        map(({ coursesByLevel, roadmapCourses }) => {
                            const mappedCourses = coursesByLevel
                                .filter((course) => {
                                    const isPublished = course['isPublished'];
                                    return isPublished !== false;
                                })
                                .map((course) => this.mapCourseDtoToAcademyCourse(course, stage.id, stage.number));

                            return this.mergeRoadmapPrerequisites(mappedCourses, roadmapCourses);
                        }),
                        catchError(() => of([] as AcademyCourse[]))
                    )
                );
                return forkJoin(courseRequests).pipe(
                    map(coursesByLevel => coursesByLevel.flat())
                );
            }),
            switchMap((courses) => this.hydrateCoursesWithPublishedLessons(courses)),
            tap(courses => { this.academyCoursesCache = courses; }),
            catchError(() => of([])),
            shareReplay(1)
        );

        return this.academyCoursesRequest$;
    }

    /**
     * Get courses for a specific level from the API.
     */
    getAcademyCoursesByLevel(levelId: string): Observable<AcademyCourse[]> {
        const stageNumber = this.academyStagesCache.find(s => s.id === levelId)?.number ?? 1;
        return forkJoin({
            coursesByLevel: this.courseFacade.getCoursesByLevel(levelId).pipe(
                catchError(() => of([] as CourseReadDto[])),
            ),
            roadmapCourses: this.courseFacade.getRoadmap(levelId).pipe(
                catchError(() => of([] as RoadmapCourseDto[])),
            ),
        }).pipe(
            map(({ coursesByLevel, roadmapCourses }) => {
                const mappedCourses = coursesByLevel
                    .filter((course) => {
                        const isPublished = course['isPublished'];
                        return isPublished !== false;
                    })
                    .map((course) => this.mapCourseDtoToAcademyCourse(course, levelId, stageNumber));

                return this.mergeRoadmapPrerequisites(mappedCourses, roadmapCourses);
            }),
            switchMap((courses) => this.hydrateCoursesWithPublishedLessons(courses)),
            catchError(() => of([]))
        );
    }

    getAcademyCourseById(courseId: string): Observable<AcademyCourse> {
        return this.courseFacade.getCourseById(courseId).pipe(
            map(course => {
                const cachedCourse = this.academyCoursesCache.find(existing => existing.id === courseId);

                if (!course) {
                    return {
                        id: courseId,
                        stageId: cachedCourse?.stageId ?? 1,
                        levelId: cachedCourse?.levelId ?? '',
                        title: 'Unknown Course',
                        category: 'social-topics' as const,
                        categoryLabel: 'C: Social Topics',
                        lessons: 0,
                        duration: '0m',
                    };
                }

                const resolvedLevelId = course.levelId ?? cachedCourse?.levelId;
                const resolvedStageNumber = this.academyStagesCache.find((stage) => stage.id === resolvedLevelId)?.number
                    ?? cachedCourse?.stageId
                    ?? 1;

                return this.mapCourseDtoToAcademyCourse(course, resolvedLevelId, resolvedStageNumber);
            }),
            switchMap((course) => this.hydrateCourseWithPublishedLessons(course)),
            tap(course => {
                const index = this.academyCoursesCache.findIndex(existing => existing.id === course.id);
                if (index === -1) {
                    return;
                }

                const existing = this.academyCoursesCache[index];
                this.academyCoursesCache[index] = {
                    ...existing,
                    ...course,
                    stageId: course.stageId || existing.stageId,
                    levelId: course.levelId || existing.levelId,
                };

                if (existing.stageId !== this.academyCoursesCache[index].stageId) {
                    this.invalidateProgressCache();
                }
            }),
            catchError(() =>
                of({
                    id: courseId,
                    stageId: 1,
                    levelId: '',
                    title: 'Unknown Course',
                    category: 'social-topics' as const,
                    categoryLabel: 'C: Social Topics',
                    lessons: 0,
                    duration: '0m',
                })
            )
        );
    }

    getAcademyLessons(courseId: string, forceRefresh = false): Observable<AcademyLesson[]> {
        const cachedLessons = this.lessonsCache.get(courseId);
        if (!forceRefresh && cachedLessons && cachedLessons.length > 0) {
            return of(cachedLessons);
        }

        return this.lessonFacade.getCourseLessons(courseId).pipe(
            map(lessons => lessons
                .filter((lesson) => lesson.isPublished !== false)
                .map((lesson, index) => this.mapLessonDtoToAcademyLesson(lesson, courseId, index))
            ),
            switchMap((lessons) => this.hydrateVideoDurations(lessons)),
            tap(lessons => {
                this.lessonsCache.set(courseId, lessons);
                this.updateCachedCourseDuration(courseId, lessons);
            }),
            catchError(() => of([]))
        );
    }

    calculateCourseVideoDuration(
        lessons: readonly Pick<AcademyLesson, 'type' | 'duration'>[],
        fallbackDuration = '0m',
    ): string {
        const totalMediaSeconds = lessons
            .filter((lesson) => lesson.type !== 'quiz')
            .reduce((total, lesson) => total + this.parseDurationLabelToSeconds(lesson.duration), 0);

        if (totalMediaSeconds <= 0) {
            return fallbackDuration;
        }

        return this.formatCourseDurationFromSeconds(totalMediaSeconds);
    }

    /**
     * Get lessons for a specific course with their progress.
     * Uses API lessons and derives an initial progress projection.
     */
    getCourseLessonsWithProgress(courseId: string): Observable<(AcademyLesson & { progress: LessonProgress })[]> {
        return forkJoin({
            apiLessons: this.getAcademyLessons(courseId),
            courseProgress: this.progressFacade.getCourseProgress(courseId).pipe(catchError(() => of(null))),
        }).pipe(
            map(({ apiLessons, courseProgress }) => {
                const sortedLessons = [...apiLessons].sort((a, b) => a.order - b.order);
                const completedByApi = Math.max(
                    0,
                    Math.min(sortedLessons.length, Number(courseProgress?.completedLessonsCount ?? 0)),
                );

                const locallyCompletedIds = this.getLocallyCompletedLessonIds(courseId);

                const mappedLessons: Array<AcademyLesson & { progress: LessonProgress }> = sortedLessons.map((apiLesson, index) => {
                    const isCompleted = locallyCompletedIds.has(apiLesson.id)
                        || this.isLegacyVideoCompletionRecorded(apiLesson.id)
                        || index < completedByApi;
                    const status: LessonStatus = isCompleted ? 'completed' : 'available';
                    const progress: LessonProgress = {
                        lessonId: apiLesson.id,
                        courseId,
                        status,
                        isCompleted,
                    };

                    return {
                        ...apiLesson,
                        progress,
                    };
                });

                const firstPendingIndex = mappedLessons.findIndex((lesson) => !lesson.progress.isCompleted);
                if (firstPendingIndex >= 0) {
                    const currentLesson = mappedLessons[firstPendingIndex];
                    const currentProgress: LessonProgress = {
                        ...currentLesson.progress,
                        status: 'current',
                    };
                    mappedLessons[firstPendingIndex] = {
                        ...currentLesson,
                        progress: currentProgress,
                    };
                }

                return mappedLessons;
            }),
        );
    }

    /**
     * Update lesson progress.
     * Persists completion and watch position through lesson progress APIs.
     */
    updateLessonProgress(request: UpdateLessonProgressRequest): Observable<LessonProgress> {
        this.rememberRecentLessonVisit({
            courseId: String(request.courseId),
            lessonId: String(request.lessonId),
        });

        if (request.isCompleted) {
            this.syncCompletedLessonLocally(String(request.courseId), String(request.lessonId));
        }

        const requestedProgress = request.isCompleted
            ? 100
            : Math.max(0, Math.min(100, Number(request.watchTime ?? 0)));

        return this.lessonProgressFacade
            .saveLessonVideoProgress({
                courseId: request.courseId,
                lessonId: request.lessonId,
                videoProgressPercentage: requestedProgress,
            })
            .pipe(
                map(() => {
                    this.invalidateProgressCache();
                    return this.buildLessonProgress(request.lessonId, request.courseId, !!request.isCompleted);
                }),
                catchError(() => {
                    this.invalidateProgressCache();
                    return of(this.buildLessonProgress(request.lessonId, request.courseId, !!request.isCompleted));
                }),
            );
    }

    rememberRecentLessonVisit(request: RememberRecentLessonVisitRequest): void {
        if (!this.isBrowser) {
            return;
        }

        const courseId = request.courseId?.trim();
        const lessonId = request.lessonId?.trim();
        if (!courseId || !lessonId) {
            return;
        }

        const snapshot: RecentLessonVisitSnapshot = {
            courseId,
            lessonId,
            visitedAt: new Date().toISOString(),
            lessonType: this.parseOptionalLessonType(request.lessonType),
            lessonNumber: this.parseOptionalFiniteNumber(request.lessonNumber, 1, Number.MAX_SAFE_INTEGER),
            lessonTitle: this.parseOptionalTrimmedString(request.lessonTitle),
            currentTimeSeconds: this.parseOptionalFiniteNumber(request.currentTimeSeconds, 0, Number.MAX_SAFE_INTEGER),
            totalTimeSeconds: this.parseOptionalFiniteNumber(request.totalTimeSeconds, 0, Number.MAX_SAFE_INTEGER),
            progressPercentage: this.parseOptionalFiniteNumber(request.progressPercentage, 0, 100),
        };

        globalThis.localStorage.setItem(
            AcademyProgressService.localRecentLessonKey,
            JSON.stringify(snapshot),
        );
    }

    /**
     * Mark lesson as completed.
     */
    markLessonCompleted(lessonId: string, courseId: string): Observable<LessonProgress> {
        this.markLocalLessonCompleted(courseId, lessonId);
        this.invalidateProgressCache();
        
        return this.updateLessonProgress({
            lessonId,
            courseId,
            isCompleted: true,
        });
    }

    markCourseQuizPassed(courseId: string): void {
        if (!this.isBrowser || !courseId) {
            return;
        }

        globalThis.localStorage.setItem(
            `${AcademyProgressService.localQuizPassedPrefix}${courseId}`,
            'true',
        );
        this.ensureCourseEnrollmentCompletionStatus(courseId);
        this.invalidateProgressCache();
    }

    /**
     * Submit quiz result and potentially unlock next stage.
     * Uses client-side evaluation until a dedicated backend endpoint is available.
     */
    submitQuizResult(request: SubmitQuizResultRequest): Observable<StageQuizResult> {
        return of({
            stageNumber: request.stageNumber,
            score: request.score,
            passed: request.passed,
            nextStageUnlocked: request.passed,
        });
    }

    /**
     * Get course data by ID from cache
     */
    getCourseById(courseId: string): AcademyCourse | undefined {
        return this.academyCoursesCache.find(course => course.id === courseId);
    }

    /**
     * Get lesson data by ID from cache
     */
    getLessonById(lessonId: string): AcademyLesson | undefined {
        for (const lessons of this.lessonsCache.values()) {
            const lesson = lessons.find(item => item.id === lessonId);
            if (lesson) {
                return lesson;
            }
        }
        return undefined;
    }

    /**
     * Get lessons for a course from cache
     */
    getCourseLessons(courseId: string): AcademyLesson[] {
        return (this.lessonsCache.get(courseId) ?? []).slice().sort((a, b) => a.order - b.order);
    }

    /**
     * Get first lesson of a course
     */
    getFirstLessonOfCourse(courseId: string): AcademyLesson | undefined {
        const lessons = this.getCourseLessons(courseId);
        return lessons.length > 0 ? lessons[0] : undefined;
    }

    /**
     * Get quiz lesson of a course (last lesson with type 'quiz')
     */
    getQuizLessonOfCourse(courseId: string): AcademyLesson | undefined {
        const lessons = this.getCourseLessons(courseId);
        return lessons.find((l) => l.type === 'quiz');
    }

    /**
     * Get next lesson in a course
     */
    getNextLesson(courseId: string, currentLessonId: string): AcademyLesson | undefined {
        const lessons = this.getCourseLessons(courseId);
        const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
        return currentIndex >= 0 && currentIndex < lessons.length - 1
            ? lessons[currentIndex + 1]
            : undefined;
    }

    /**
     * Get previous lesson in a course
     */
    getPreviousLesson(courseId: string, currentLessonId: string): AcademyLesson | undefined {
        const lessons = this.getCourseLessons(courseId);
        const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
        return currentIndex > 0 ? lessons[currentIndex - 1] : undefined;
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private buildEmptyProgress(): StudentProgress {
        return {
            studentId: 'anonymous',
            currentStage: 1,
            recentLesson: null,
            stageProgress: [],
            courseProgress: [],
            lessonProgress: [],
        };
    }

    private buildStudentProgress(
        studentId: string,
        courses: AcademyCourse[],
        enrollmentRecordsByCourseId: Map<string, EnrollmentReadDto>,
        recentLesson: RecentLessonInfo | null,
        progressRecords: ProgressReadDto[],
    ): StudentProgress {
        const sortedStageIds = Array.from(new Set(courses.map(course => course.stageId))).sort((a, b) => a - b);
        const unlockedStageIds = new Set<number>(sortedStageIds);
        const progressRecordByCourseId = this.normalizeProgressRecords(progressRecords);

        const courseProgressById = new Map<string, CourseProgress>();
        const sortedCourses = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const courseProgress = sortedCourses.map((course) => {
            const enrollment = enrollmentRecordsByCourseId.get(String(course.id));
            const enrollmentStatus = this.parseEnrollmentStatus(enrollment?.status);
            const isEnrolled = this.isEnrollmentConsideredEnrolled(enrollment?.status);
            const isEnrollmentCompleted = enrollmentStatus === EnrollmentStatus.Completed;
            const prerequisites = (course.prerequisites ?? []).filter((prereqId) => prereqId !== course.id);
            const hasUnfinishedPrerequisites = prerequisites.some((prereqId) => {
                const prereqProgress = courseProgressById.get(prereqId);
                return prereqProgress?.status !== 'completed';
            });

            let status: CourseStatus = 'locked';

            if (!hasUnfinishedPrerequisites) {
                status = 'available';
            }

            if (isEnrolled) {
                status = 'in-progress';
            }

            if (isEnrollmentCompleted) {
                status = 'completed';
            }

            const apiProgress = progressRecordByCourseId.get(course.id);
            const normalizedProgress = apiProgress
                ? this.normalizeProgressPercentage(apiProgress.lessonCompletionRate ?? apiProgress.progress ?? 0)
                : 0;
            const totalCourseItems = this.resolveCourseItemCount(course.id, course.lessons);
            const apiCompletedLessons = apiProgress && typeof apiProgress.totalLessonsCompleted === 'number'
                ? Math.max(0, apiProgress.totalLessonsCompleted)
                : 0;
            const isApiCompleted = !!apiProgress?.completedProgress || !!apiProgress?.isCompleted;
            const requiresQuizPass = this.courseHasAnyQuiz(course.id);
            const quizPassed = isApiCompleted || isEnrollmentCompleted || this.isCourseQuizPassedLocally(course.id);
            const completedStandaloneQuizCount = quizPassed ? this.getStandaloneQuizCount(course.id) : 0;
            const locallyCompletedLessons = this.getLocallyCompletedLessonIds(course.id).size;
            let completedLessonsBeforeStandaloneQuiz = Math.max(apiCompletedLessons, locallyCompletedLessons);
            if (requiresQuizPass && quizPassed) {
                completedLessonsBeforeStandaloneQuiz = Math.max(completedLessonsBeforeStandaloneQuiz, totalCourseItems - completedStandaloneQuizCount);
            }
            const completedLessonsCount = totalCourseItems > 0
                ? Math.min(totalCourseItems, completedLessonsBeforeStandaloneQuiz + completedStandaloneQuizCount)
                : completedLessonsBeforeStandaloneQuiz + completedStandaloneQuizCount;
            const completionRateFromLessons = totalCourseItems > 0
                ? this.normalizeProgressPercentage((completedLessonsCount / totalCourseItems) * 100)
                : 0;
            let progressBeforeCompletion = isApiCompleted
                ? 100
                : Math.max(normalizedProgress, completionRateFromLessons);

            if (!isApiCompleted && requiresQuizPass && !quizPassed) {
                progressBeforeCompletion = completionRateFromLessons;
            }
            const hasTrackableCourseItems = totalCourseItems > 0;
            const completedByRule = hasTrackableCourseItems
                && completedLessonsCount >= totalCourseItems
                && (!requiresQuizPass || quizPassed);
            const isCourseCompleted = isApiCompleted || completedByRule || isEnrollmentCompleted;

            if (isCourseCompleted) {
                status = 'completed';
            } else if (progressBeforeCompletion > 0 || isEnrolled) {
                status = 'in-progress';
            }

            const progressEntry: CourseProgress = {
                courseId: course.id,
                status,
                progress: isCourseCompleted ? 100 : progressBeforeCompletion,
                completedLessons: isCourseCompleted
                    ? Math.max(totalCourseItems, completedLessonsCount)
                    : Math.min(totalCourseItems, completedLessonsCount),
                totalLessons: totalCourseItems,
                quizPassed,
            };

            courseProgressById.set(course.id, progressEntry);

            return progressEntry;
        });

        const stageProgress: StageProgress[] = sortedStageIds.map((stageId) => {
            const stageCourses = courseProgress.filter(course => {
                const matchedCourse = courses.find(item => item.id === course.courseId);
                return matchedCourse?.stageId === stageId;
            });

            return {
                stageNumber: stageId,
                isUnlocked: unlockedStageIds.has(stageId),
                quizPassed: false,
                completedCourses: stageCourses.filter(item => item.progress >= 100).length,
                totalCourses: stageCourses.length,
            };
        });

        return {
            studentId,
            currentStage: 1,
            recentLesson,
            stageProgress,
            courseProgress,
            lessonProgress: [],
        };
    }

    private resolveRecentLesson(
        courses: AcademyCourse[],
        enrolledCourseIds: Set<string>,
        progressRecords: ProgressReadDto[],
    ): Observable<RecentLessonInfo | null> {
        const progressRecordByCourseId = this.normalizeProgressRecords(progressRecords);
        const recentVisitSnapshot = this.readRecentLessonVisit();
        const recentVisitedCourse = recentVisitSnapshot
            ? courses.find((course) => course.id === recentVisitSnapshot.courseId)
            : undefined;

        if (recentVisitSnapshot && recentVisitedCourse) {
            return this.getAcademyLessons(String(recentVisitedCourse.id)).pipe(
                map((lessons) => this.mapRecentLessonInfo(
                    recentVisitedCourse,
                    lessons,
                    progressRecordByCourseId.get(recentVisitedCourse.id),
                    recentVisitSnapshot.lessonId,
                    recentVisitSnapshot,
                )),
                map((recentLesson) =>
                    recentLesson
                    ?? this.mapRecentLessonInfoFromSnapshotFallback(
                        recentVisitedCourse,
                        progressRecordByCourseId.get(recentVisitedCourse.id),
                        recentVisitSnapshot,
                    )
                ),
                catchError(() =>
                    of(
                        this.mapRecentLessonInfoFromSnapshotFallback(
                            recentVisitedCourse,
                            progressRecordByCourseId.get(recentVisitedCourse.id),
                            recentVisitSnapshot,
                        )
                    )
                ),
            );
        }

        const latestProgressCourse = this.resolveLatestProgressCourse(courses, progressRecords);
        const inProgressFromApi = courses
            .map((course) => ({
                course,
                progress: this.normalizeProgressPercentage(
                    progressRecordByCourseId.get(course.id)?.lessonCompletionRate
                    ?? progressRecordByCourseId.get(course.id)?.progress
                    ?? 0,
                ),
            }))
            .filter((entry) => entry.progress > 0 && entry.progress < 100)
            .sort((a, b) => b.progress - a.progress)
            .at(0)?.course;

        const fallbackCourse = courses[0];
        const enrolledCourse = courses.find(course => enrolledCourseIds.has(String(course.id)));
        const targetCourse = latestProgressCourse ?? inProgressFromApi ?? enrolledCourse ?? fallbackCourse;

        if (!targetCourse) {
            return of(null);
        }

        return this.getAcademyLessons(String(targetCourse.id)).pipe(
            map((lessons) => this.mapRecentLessonInfo(
                targetCourse,
                lessons,
                progressRecordByCourseId.get(targetCourse.id),
            )),
            catchError(() => of(null))
        );
    }

    private mapRecentLessonInfo(
        course: AcademyCourse,
        lessons: AcademyLesson[],
        progressRecord?: ProgressReadDto,
        preferredLessonId?: string,
        visitSnapshot?: RecentLessonVisitSnapshot,
    ): RecentLessonInfo | null {
        const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
        const fallbackLesson = sortedLessons[0];
        if (!fallbackLesson) {
            return null;
        }

        const lessonCountFromFeed = Math.max(sortedLessons.length, Math.max(0, course.lessons));
        const effectiveTotalLessons = this.resolveCourseItemCount(course.id, lessonCountFromFeed);
        const completedFromProgress = this.resolveCompletedLessonCount(progressRecord, effectiveTotalLessons);
        const completedFromLocal = this.resolveLocalCompletedLessonCount(
            course.id,
            sortedLessons,
            effectiveTotalLessons,
        );
        const completedStandaloneQuizCount = this.isCourseQuizPassedLocally(course.id)
            ? this.getStandaloneQuizCount(course.id)
            : 0;
        let completedLessonsBeforeStandaloneQuiz = Math.max(completedFromProgress, completedFromLocal);
        if (this.courseHasAnyQuiz(course.id) && this.isCourseQuizPassedLocally(course.id)) {
            completedLessonsBeforeStandaloneQuiz = Math.max(completedLessonsBeforeStandaloneQuiz, effectiveTotalLessons - completedStandaloneQuizCount);
        }
        const completedLessons = effectiveTotalLessons > 0
            ? Math.min(effectiveTotalLessons, completedLessonsBeforeStandaloneQuiz + completedStandaloneQuizCount)
            : completedLessonsBeforeStandaloneQuiz + completedStandaloneQuizCount;
        const preferredLesson = preferredLessonId
            ? sortedLessons.find((lesson) => lesson.id === preferredLessonId)
            : undefined;
        const resolvedLessonIndex = this.resolveRecentLessonIndex(completedLessons, sortedLessons.length);
        const resolvedLesson = preferredLesson ?? sortedLessons[resolvedLessonIndex] ?? fallbackLesson;
        const courseProgress = this.calculateCourseCompletionProgress(completedLessons, effectiveTotalLessons);

        const playbackSnapshot = this.resolveMediaPlaybackSnapshot(resolvedLesson, visitSnapshot);

        return {
            stageNumber: course.stageId,
            courseId: course.id,
            courseName: course.title,
            lessonId: resolvedLesson.id,
            lessonType: resolvedLesson.type,
            lessonNumber: resolvedLesson.order,
            lessonTitle: resolvedLesson.title,
            thumbnailUrl: course.thumbnailUrl ?? '',
            progress: courseProgress,
            currentTime: playbackSnapshot.currentTimeLabel,
            totalTime: playbackSnapshot.totalTimeLabel,
            completedLessons: Math.min(effectiveTotalLessons, completedLessons),
            totalLessons: effectiveTotalLessons,
        };
    }

    private mapRecentLessonInfoFromSnapshotFallback(
        course: AcademyCourse,
        progressRecord: ProgressReadDto | undefined,
        visitSnapshot: RecentLessonVisitSnapshot,
    ): RecentLessonInfo {
        const effectiveTotalLessons = this.resolveCourseItemCount(course.id, Math.max(0, course.lessons));
        const completedFromProgress = this.resolveCompletedLessonCount(progressRecord, effectiveTotalLessons);
        const completedFromLocal = this.resolveLocalCompletedLessonCount(course.id, [], effectiveTotalLessons);
        const completedStandaloneQuizCount = this.isCourseQuizPassedLocally(course.id)
            ? this.getStandaloneQuizCount(course.id)
            : 0;
        let completedLessonsBeforeStandaloneQuiz = Math.max(completedFromProgress, completedFromLocal);
        if (this.courseHasAnyQuiz(course.id) && this.isCourseQuizPassedLocally(course.id)) {
            completedLessonsBeforeStandaloneQuiz = Math.max(completedLessonsBeforeStandaloneQuiz, effectiveTotalLessons - completedStandaloneQuizCount);
        }
        const completedLessons = effectiveTotalLessons > 0
            ? Math.min(effectiveTotalLessons, completedLessonsBeforeStandaloneQuiz + completedStandaloneQuizCount)
            : completedLessonsBeforeStandaloneQuiz + completedStandaloneQuizCount;
        const courseProgress = this.calculateCourseCompletionProgress(completedLessons, effectiveTotalLessons);

        const totalSeconds =
            typeof visitSnapshot.totalTimeSeconds === 'number' && Number.isFinite(visitSnapshot.totalTimeSeconds)
                ? Math.max(0, Math.round(visitSnapshot.totalTimeSeconds))
                : 0;
        const currentFromSnapshot =
            typeof visitSnapshot.currentTimeSeconds === 'number' && Number.isFinite(visitSnapshot.currentTimeSeconds)
                ? Math.max(0, Math.round(visitSnapshot.currentTimeSeconds))
                : undefined;
        const percentageFromSnapshot =
            typeof visitSnapshot.progressPercentage === 'number' && Number.isFinite(visitSnapshot.progressPercentage)
                ? Math.max(0, Math.min(100, visitSnapshot.progressPercentage))
                : 0;

        const currentFromPercentage = totalSeconds > 0
            ? Math.round((percentageFromSnapshot / 100) * totalSeconds)
            : 0;
        const currentSeconds = Math.min(
            totalSeconds > 0 ? totalSeconds : Number.MAX_SAFE_INTEGER,
            currentFromSnapshot ?? currentFromPercentage,
        );

        const computedLessonNumber =
            typeof visitSnapshot.lessonNumber === 'number' && Number.isFinite(visitSnapshot.lessonNumber)
                ? Math.max(1, Math.round(visitSnapshot.lessonNumber))
                : this.resolveRecentLessonIndex(completedLessons, Math.max(1, effectiveTotalLessons || 1)) + 1;

        const normalizedLessonTitle =
            typeof visitSnapshot.lessonTitle === 'string' && visitSnapshot.lessonTitle.trim().length > 0
                ? visitSnapshot.lessonTitle.trim()
                : `Lesson ${computedLessonNumber}`;

        return {
            stageNumber: course.stageId,
            courseId: course.id,
            courseName: course.title,
            lessonId: visitSnapshot.lessonId,
            lessonType: visitSnapshot.lessonType,
            lessonNumber: computedLessonNumber,
            lessonTitle: normalizedLessonTitle,
            thumbnailUrl: course.thumbnailUrl ?? '',
            progress: courseProgress,
            currentTime: this.formatVideoDurationLabel(currentSeconds),
            totalTime: totalSeconds > 0 ? this.formatVideoDurationLabel(totalSeconds) : '0:00',
            completedLessons: Math.min(effectiveTotalLessons, completedLessons),
            totalLessons: effectiveTotalLessons,
        };
    }

    private resolveCompletedLessonCount(progressRecord: ProgressReadDto | undefined, totalLessons: number): number {
        const completedFromProgress = progressRecord?.totalLessonsCompleted;
        const completedFromAlias = progressRecord?.['completedLessonsCount'];

        let rawCompletedCount = 0;
        if (typeof completedFromProgress === 'number') {
            rawCompletedCount = completedFromProgress;
        } else if (typeof completedFromAlias === 'number') {
            rawCompletedCount = completedFromAlias;
        }
        const boundedCompletedCount = Number.isFinite(rawCompletedCount)
            ? Math.max(0, Math.floor(rawCompletedCount))
            : 0;

        return totalLessons > 0
            ? Math.min(totalLessons, boundedCompletedCount)
            : boundedCompletedCount;
    }

    private resolveLocalCompletedLessonCount(
        courseId: string,
        publishedLessons: AcademyLesson[],
        totalLessons: number,
    ): number {
        const localCompletedIds = this.getLocallyCompletedLessonIds(courseId);
        if (localCompletedIds.size === 0) {
            return 0;
        }

        if (publishedLessons.length === 0) {
            return totalLessons > 0
                ? Math.min(totalLessons, localCompletedIds.size)
                : localCompletedIds.size;
        }

        const publishedLessonIdSet = new Set(publishedLessons.map((lesson) => lesson.id));
        const matchingCompletedCount = Array.from(localCompletedIds).filter((lessonId) => publishedLessonIdSet.has(lessonId)).length;

        return totalLessons > 0
            ? Math.min(totalLessons, matchingCompletedCount)
            : matchingCompletedCount;
    }

    private calculateCourseCompletionProgress(completedLessons: number, totalLessons: number): number {
        if (totalLessons <= 0) {
            return 0;
        }

        return this.normalizeProgressPercentage((Math.min(totalLessons, Math.max(0, completedLessons)) / totalLessons) * 100);
    }

    private resolveRecentLessonIndex(completedLessons: number, totalLessons: number): number {
        if (totalLessons <= 1) {
            return 0;
        }

        if (completedLessons >= totalLessons) {
            return totalLessons - 1;
        }

        return Math.min(totalLessons - 1, Math.max(0, completedLessons));
    }

    private resolveMediaPlaybackSnapshot(
        lesson: AcademyLesson,
        visitSnapshot?: RecentLessonVisitSnapshot,
    ): { currentTimeLabel: string; totalTimeLabel: string } {
        const isMediaLesson = lesson.type === 'video' || lesson.type === 'audio';
        if (!isMediaLesson) {
            return {
                currentTimeLabel: '0:00',
                totalTimeLabel: lesson.duration || '0:00',
            };
        }

        const totalFromLesson = this.parseDurationLabelToSeconds(lesson.duration);
        const totalFromVisit =
            typeof visitSnapshot?.totalTimeSeconds === 'number' && Number.isFinite(visitSnapshot.totalTimeSeconds)
                ? Math.max(0, Math.round(visitSnapshot.totalTimeSeconds))
                : 0;
        const totalSeconds = totalFromVisit > 0 ? totalFromVisit : totalFromLesson;

        const percentageFromVisit =
            typeof visitSnapshot?.progressPercentage === 'number' && Number.isFinite(visitSnapshot.progressPercentage)
                ? Math.max(0, Math.min(100, visitSnapshot.progressPercentage))
                : undefined;
        const percentageFromLocal = this.readStoredPlaybackProgressPercentage(lesson.id);
        const resolvedPercentage = percentageFromVisit ?? percentageFromLocal;

        const currentFromVisit =
            typeof visitSnapshot?.currentTimeSeconds === 'number' && Number.isFinite(visitSnapshot.currentTimeSeconds)
                ? Math.max(0, Math.round(visitSnapshot.currentTimeSeconds))
                : undefined;
        const currentFromPercentage = totalSeconds > 0
            ? Math.round((resolvedPercentage / 100) * totalSeconds)
            : 0;
        const currentSeconds = Math.min(
            totalSeconds > 0 ? totalSeconds : Number.MAX_SAFE_INTEGER,
            currentFromVisit ?? currentFromPercentage,
        );

        return {
            currentTimeLabel: this.formatVideoDurationLabel(currentSeconds),
            totalTimeLabel: totalSeconds > 0
                ? this.formatVideoDurationLabel(totalSeconds)
                : (lesson.duration || '0:00'),
        };
    }

    private readStoredPlaybackProgressPercentage(lessonId: string): number {
        if (!this.isBrowser || !lessonId) {
            return 0;
        }

        const rawValue = globalThis.localStorage.getItem(`video-progress-${lessonId}`);
        if (!rawValue) {
            return 0;
        }

        const parsedValue = Number.parseFloat(rawValue);
        if (!Number.isFinite(parsedValue)) {
            return 0;
        }

        return Math.max(0, Math.min(100, parsedValue));
    }

    private resolveLatestProgressCourse(
        courses: AcademyCourse[],
        progressRecords: ProgressReadDto[],
    ): AcademyCourse | undefined {
        const latestEntry = progressRecords
            .map((record) => {
                const courseId = typeof record.courseId === 'string' ? record.courseId : '';
                if (!courseId) {
                    return null;
                }

                const progress = this.normalizeProgressPercentage(
                    record.lessonCompletionRate
                    ?? record.progress
                    ?? 0,
                );

                return {
                    courseId,
                    timestamp: this.resolveProgressRecordTimestamp(record),
                    progress,
                };
            })
            .filter((entry): entry is { courseId: string; timestamp: number; progress: number } => entry !== null)
            .sort((a, b) => {
                if (a.timestamp !== b.timestamp) {
                    return b.timestamp - a.timestamp;
                }

                return b.progress - a.progress;
            })
            .find((entry) => courses.some((course) => course.id === entry.courseId));

        if (!latestEntry) {
            return undefined;
        }

        return courses.find((course) => course.id === latestEntry.courseId);
    }

    private resolveProgressRecordTimestamp(record: ProgressReadDto): number {
        const timestampCandidates: unknown[] = [
            record.lastUpdated,
            record['updatedAt'],
            record['modifiedAt'],
            record['createdAt'],
        ];

        for (const candidate of timestampCandidates) {
            if (typeof candidate !== 'string' || candidate.trim().length === 0) {
                continue;
            }

            const parsedTimestamp = Date.parse(candidate);
            if (!Number.isNaN(parsedTimestamp)) {
                return parsedTimestamp;
            }
        }

        return 0;
    }

    private readRecentLessonVisit(): RecentLessonVisitSnapshot | null {
        if (!this.isBrowser) {
            return null;
        }

        const rawSnapshot = globalThis.localStorage.getItem(AcademyProgressService.localRecentLessonKey);
        if (!rawSnapshot) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawSnapshot) as Partial<RecentLessonVisitSnapshot>;
            const courseId = this.parseOptionalTrimmedString(parsed.courseId) ?? '';
            const lessonId = this.parseOptionalTrimmedString(parsed.lessonId) ?? '';
            if (!courseId || !lessonId) {
                return null;
            }

            return {
                courseId,
                lessonId,
                visitedAt: this.parseOptionalTrimmedString(parsed.visitedAt) ?? '',
                lessonType: this.parseOptionalLessonType(parsed.lessonType),
                lessonNumber: this.parseOptionalRoundedPositiveInt(parsed.lessonNumber),
                lessonTitle: this.parseOptionalTrimmedString(parsed.lessonTitle),
                currentTimeSeconds: this.parseOptionalFiniteNumber(parsed.currentTimeSeconds, 0),
                totalTimeSeconds: this.parseOptionalFiniteNumber(parsed.totalTimeSeconds, 0),
                progressPercentage: this.parseOptionalFiniteNumber(parsed.progressPercentage, 0, 100),
            };
        } catch {
            return null;
        }
    }

    private parseOptionalTrimmedString(value: unknown): string | undefined {
        if (typeof value !== 'string') {
            return undefined;
        }

        const trimmedValue = value.trim();
        return trimmedValue.length > 0 ? trimmedValue : undefined;
    }

    private parseOptionalLessonType(value: unknown): AcademyLessonType | undefined {
        return value === 'intro'
            || value === 'video'
            || value === 'article'
            || value === 'quiz'
            || value === 'audio'
            ? value
            : undefined;
    }

    private parseOptionalRoundedPositiveInt(value: unknown): number | undefined {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return undefined;
        }

        return Math.max(1, Math.round(value));
    }

    private parseOptionalFiniteNumber(value: unknown, min?: number, max?: number): number | undefined {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return undefined;
        }

        let normalizedValue = value;

        if (typeof min === 'number') {
            normalizedValue = Math.max(min, normalizedValue);
        }

        if (typeof max === 'number') {
            normalizedValue = Math.min(max, normalizedValue);
        }

        return normalizedValue;
    }

    private normalizeProgressRecords(progressRecords: ProgressReadDto[]): Map<string, ProgressReadDto> {
        const recordMap = new Map<string, ProgressReadDto>();

        for (const record of progressRecords) {
            const courseId = typeof record.courseId === 'string' ? record.courseId : '';
            if (!courseId) {
                continue;
            }

            const existing = recordMap.get(courseId);
            if (!existing) {
                recordMap.set(courseId, record);
                continue;
            }

            const existingProgress = this.normalizeProgressPercentage(existing.lessonCompletionRate ?? existing.progress ?? 0);
            const currentProgress = this.normalizeProgressPercentage(record.lessonCompletionRate ?? record.progress ?? 0);

            if (currentProgress >= existingProgress) {
                recordMap.set(courseId, record);
            }
        }

        return recordMap;
    }

    private normalizeProgressPercentage(rawValue: unknown): number {
        if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
            return 0;
        }

        const normalized = rawValue <= 1 ? rawValue * 100 : rawValue;
        return Math.max(0, Math.min(100, Math.round(normalized)));
    }

    /**
     * Build a LessonProgress object from minimal data.
     */
    private buildLessonProgress(lessonId: string, courseId: string, completed: boolean): LessonProgress {
        return {
            lessonId,
            courseId,
            status: completed ? 'completed' as LessonStatus : 'in-progress' as LessonStatus,
            isCompleted: completed,
            completedAt: completed ? new Date().toISOString() : undefined,
        };
    }

    private withCourseProgress(course: AcademyCourse, courseProgress: CourseProgress[]): AcademyCourse & { progress: CourseProgress } {
        const progress = courseProgress.find(item => item.courseId === course.id);
        if (progress) {
            return { ...course, progress };
        }

        return {
            ...course,
            progress: {
                courseId: course.id,
                status: 'locked',
                progress: 0,
                completedLessons: 0,
                totalLessons: course.lessons,
                quizPassed: false,
            },
        };
    }

    private attachProgressToCourses(
        courses: AcademyCourse[],
        courseProgress: CourseProgress[],
    ): (AcademyCourse & { progress: CourseProgress })[] {
        return courses.map((course) => this.withCourseProgress(course, courseProgress));
    }

    private mapLevelToStage(level: LevelReadDto, index: number): AcademyStageApi {
        return {
            id: level.id ?? '',
            number: index,
            title: level.title ?? `Stage ${index}`,
            description: level.description ?? '',
            order: level.order ?? index,
            difficulty: level.difficulty ?? 1,
        };
    }

    private mapCourseDtoToAcademyCourse(course: CourseReadDto, levelId: string | undefined, stageNumber: number): AcademyCourse {
        const id = course.id ?? '';
        const title = course.title ?? 'Untitled course';
        const lessons = this.resolveLessonCount(course);
        const category = this.mapCourseCategory(course.category);
        const prerequisites = this.extractPrerequisiteIds(course).filter((prerequisiteId) => prerequisiteId !== id);

        return {
            id,
            stageId: stageNumber,
            levelId: levelId ?? course.levelId ?? '',
            title,
            isPublished: course.isPublished,
            category,
            categoryLabel: this.buildCategoryLabel(course.category),
            lessons,
            duration: this.buildDurationText(lessons),
            thumbnailUrl: toApiMediaUrl(course.thumbnailUrl ?? null) ?? undefined,
            description: course.description ?? undefined,
            order: course.order,
            prerequisites,
        };
    }

    private mergeRoadmapPrerequisites(
        courses: AcademyCourse[],
        roadmapCourses: RoadmapCourseDto[],
    ): AcademyCourse[] {
        if (courses.length === 0 || roadmapCourses.length === 0) {
            return courses;
        }

        const roadmapPrerequisitesByCourseId = new Map<string, string[]>();
        for (const roadmapCourse of roadmapCourses) {
            const roadmapCourseId = typeof roadmapCourse.id === 'string'
                ? roadmapCourse.id.trim()
                : '';

            if (!roadmapCourseId) {
                continue;
            }

            roadmapPrerequisitesByCourseId.set(
                roadmapCourseId,
                this.extractPrerequisiteIds(roadmapCourse),
            );
        }

        return courses.map((course) => {
            const roadmapPrerequisites = roadmapPrerequisitesByCourseId.get(course.id) ?? [];
            if (roadmapPrerequisites.length === 0) {
                return course;
            }

            const mergedPrerequisites = Array.from(
                new Set([
                    ...(course.prerequisites ?? []),
                    ...roadmapPrerequisites,
                ]),
            ).filter((prerequisiteId) => prerequisiteId !== course.id);

            return {
                ...course,
                prerequisites: mergedPrerequisites,
            };
        });
    }

    private extractPrerequisiteIds(source: Record<string, unknown>): string[] {
        const prerequisiteIdSet = new Set<string>();

        const pushId = (candidate: unknown): void => {
            if (typeof candidate !== 'string') {
                return;
            }

            const normalizedCandidate = candidate.trim();
            if (!normalizedCandidate) {
                return;
            }

            prerequisiteIdSet.add(normalizedCandidate);
        };

        const collectFromUnknown = (value: unknown): void => {
            if (Array.isArray(value)) {
                for (const entry of value) {
                    collectFromUnknown(entry);
                }
                return;
            }

            if (typeof value === 'string') {
                pushId(value);
                return;
            }

            if (!value || typeof value !== 'object') {
                return;
            }

            const record = value as Record<string, unknown>;
            pushId(record['id']);
            pushId(record['courseId']);
            pushId(record['prerequisiteId']);
            pushId(record['prerequisiteCourseId']);
            pushId(record['requiredCourseId']);

            const nestedCourse = record['course'];
            if (nestedCourse && typeof nestedCourse === 'object') {
                pushId((nestedCourse as Record<string, unknown>)['id']);
            }
        };

        collectFromUnknown(source['prerequisiteIds']);
        collectFromUnknown(source['prerequisiteCourseIds']);
        collectFromUnknown(source['prerequisites']);
        collectFromUnknown(source['prerequisiteCourses']);
        collectFromUnknown(source['dependencies']);

        return Array.from(prerequisiteIdSet);
    }

    private resolveLessonCount(source: Record<string, unknown>): number {
        const numberOfLessons = source['numberOfLessons'];
        if (typeof numberOfLessons === 'number' && Number.isFinite(numberOfLessons)) {
            return Math.max(0, numberOfLessons);
        }

        const lessons = source['lessons'];
        if (Array.isArray(lessons)) {
            return lessons.length;
        }

        return 0;
    }

    private mapLessonDtoToAcademyLesson(
        lesson: LessonReadDto,
        courseId: string,
        index: number,
    ): AcademyLesson {
        const id = lesson.id ?? '';
        const title = lesson.title ?? `Lesson ${index + 1}`;
        const type = this.mapLessonType(lesson, index);
        const normalizedMediaUrl = toApiMediaUrl(
            lesson.externalVideoUrl ?? lesson.videoUrl ?? lesson.contentUrl ?? null,
        ) ?? undefined;

        return {
            id,
            courseId,
            title,
            isPublished: lesson.isPublished,
            duration: this.resolveLessonDurationFromDto(lesson, type),
            videoUrl: type === 'video' ? normalizedMediaUrl : undefined,
            audioUrl: type === 'audio' ? normalizedMediaUrl : undefined,
            type,
            order: lesson.order ?? (index + 1),
            description: lesson.content ?? undefined,
        };
    }

    private mapLessonType(lesson: LessonReadDto, index: number): AcademyLesson['type'] {
        const title = (lesson.title ?? '').toLowerCase();
        const content = (lesson.content ?? '').toLowerCase();
        const lessonType = typeof lesson.type === 'number' ? lesson.type : null;

        if (
            content.includes('quiz') ||
            title.includes('quiz') ||
            content.includes('assessment') ||
            title.includes('assessment') ||
            content.includes('exam') ||
            title.includes('exam')
        ) {
            return 'quiz';
        }

        if (
            lessonType === 4 ||
            content.includes('audio') ||
            title.includes('audio')
        ) {
            return 'audio';
        }

        if (
            lessonType === 3
            || content.includes('document')
            || title.includes('document')
            || content.includes('pdf')
            || title.includes('pdf')
        ) {
            return 'document';
        }

        if (
            lessonType === 2 ||
            content.includes('article') ||
            content.includes('text') ||
            title.includes('article')
        ) {
            return 'article';
        }

        if (
            lessonType === 1 ||
            !!lesson.videoUrl ||
            !!lesson.externalVideoUrl ||
            !!lesson.contentUrl
        ) {
            return 'video';
        }

        if (
            index === 0 ||
            content.includes('intro') ||
            content.includes('introduction') ||
            title.includes('intro') ||
            title.includes('introduction') ||
            title.includes('overview')
        ) {
            return 'intro';
        }

        return 'video';
    }

    private mapCourseCategory(value: unknown): AcademyCourse['category'] {
        const normalized = this.normalizeCategory(value);

        if (normalized.includes('faith') || normalized.includes('aqeeda') || normalized.includes('belief')) {
            return 'main-believes';
        }

        if (normalized.includes('seerah') || normalized.includes('prophet') || normalized.includes('story')) {
            return 'models-stories';
        }

        return 'social-topics';
    }

    private buildCategoryLabel(value: unknown): string {
        const normalized = this.normalizeCategory(value);
        if (!normalized) {
            return '';
        }

        return normalized
            .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
            .split(/[_\s]+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }

    private normalizeCategory(value: unknown): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private hydrateCoursesWithPublishedLessons(courses: AcademyCourse[]): Observable<AcademyCourse[]> {
        if (courses.length === 0) {
            return of([]);
        }

        return forkJoin(
            courses.map((course) => this.hydrateCourseWithPublishedLessons(course)),
        );
    }

    private hydrateCourseWithPublishedLessons(course: AcademyCourse): Observable<AcademyCourse> {
        if (!course.id) {
            return of(course);
        }

        return forkJoin({
            publishedLessons: this.getAcademyLessons(course.id),
            quizzes: this.quizFacade.getAllQuizzes({
                courseId: course.id,
                pageNumber: 1,
                pageSize: 200,
            }).pipe(catchError(() => of([] as QuizReadDto[]))),
        }).pipe(
            map(({ publishedLessons, quizzes }) => {
                const standaloneQuizCount = this.countStandaloneCourseQuizzes(quizzes);
                const hasLessonQuiz = publishedLessons.some((lesson) => lesson.type === 'quiz');
                const lessonCount = publishedLessons.filter((lesson) => lesson.type !== 'quiz').length;
                const fallbackDuration = this.buildDurationText(lessonCount);

                this.standaloneQuizCountCache.set(course.id, standaloneQuizCount);
                this.hasAnyQuizCache.set(course.id, hasLessonQuiz || standaloneQuizCount > 0);

                return {
                    ...course,
                    lessons: lessonCount,
                    duration: this.calculateCourseVideoDuration(publishedLessons, fallbackDuration),
                };
            }),
            catchError(() => of(course)),
        );
    }

    private resolveCourseItemCount(courseId: string, fallbackLessonCount: number): number {
        const cachedLessonsCount = this.getCourseLessons(courseId).length;
        const standaloneQuizCount = this.getStandaloneQuizCount(courseId);

        return Math.max(0, Math.max(fallbackLessonCount, cachedLessonsCount + standaloneQuizCount));
    }

    private getStandaloneQuizCount(courseId: string): number {
        if (!courseId) {
            return 0;
        }

        return this.standaloneQuizCountCache.get(courseId) ?? 0;
    }

    private courseHasAnyQuiz(courseId: string): boolean {
        if (!courseId) {
            return false;
        }

        const cachedHasQuiz = this.hasAnyQuizCache.get(courseId);
        if (typeof cachedHasQuiz === 'boolean') {
            return cachedHasQuiz;
        }

        const hasQuizLessonInCache = this.getCourseLessons(courseId).some((lesson) => lesson.type === 'quiz');
        return hasQuizLessonInCache || this.getStandaloneQuizCount(courseId) > 0 || this.isCourseQuizPassedLocally(courseId);
    }

    private countStandaloneCourseQuizzes(quizzes: QuizReadDto[]): number {
        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            return 0;
        }

        return quizzes.filter((quiz) => {
            const lessonId = typeof quiz.lessonId === 'string' ? quiz.lessonId.trim() : '';
            return lessonId.length === 0;
        }).length;
    }

    private buildDurationText(lessonCount: number): string {
        const estimatedMinutesPerLesson = 10;
        const totalMinutes = lessonCount * estimatedMinutesPerLesson;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours === 0) {
            return `${minutes}m`;
        }

        return `${hours}h ${minutes}m`;
    }

    private resolveLessonDurationFromDto(lesson: LessonReadDto, type: AcademyLesson['type']): string {
        if (type === 'quiz') {
            return 'Assessment';
        }

        if (type === 'article' || type === 'document') {
            return '~5 min';
        }

        const supportsPlaybackDuration = type === 'video' || type === 'audio';
        if (!supportsPlaybackDuration) {
            return '';
        }

        const rawLesson = lesson as Record<string, unknown>;

        const durationFromSeconds = this.readNumericDurationLabel(
            rawLesson,
            ['durationInSeconds', 'videoDurationInSeconds', 'lengthInSeconds'],
            1,
        );
        if (durationFromSeconds) {
            return durationFromSeconds;
        }

        const durationFromMinutes = this.readNumericDurationLabel(
            rawLesson,
            ['durationInMinutes', 'videoDurationInMinutes', 'lengthInMinutes'],
            60,
        );
        if (durationFromMinutes) {
            return durationFromMinutes;
        }

        return this.readStringDurationLabel(
            rawLesson,
            ['duration', 'videoDuration', 'durationLabel', 'length'],
        ) ?? '0:00';
    }

    private readNumericDurationLabel(
        lesson: Record<string, unknown>,
        fields: readonly string[],
        multiplier: number,
    ): string | null {
        for (const field of fields) {
            const value = lesson[field];
            if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
                continue;
            }

            return this.formatVideoDurationLabel(Math.round(value * multiplier));
        }

        return null;
    }

    private readStringDurationLabel(
        lesson: Record<string, unknown>,
        fields: readonly string[],
    ): string | null {
        for (const field of fields) {
            const value = lesson[field];
            if (typeof value !== 'string') {
                continue;
            }

            const normalizedValue = value.trim();
            if (!normalizedValue) {
                continue;
            }

            const parsedSeconds = this.parseDurationLabelToSeconds(normalizedValue);
            if (parsedSeconds > 0) {
                return this.formatVideoDurationLabel(parsedSeconds);
            }
        }

        return null;
    }

    private hydrateVideoDurations(lessons: AcademyLesson[]): Observable<AcademyLesson[]> {
        if (!this.isBrowser || lessons.length === 0) {
            return of(lessons);
        }

        const durationRequests = lessons.map((lesson) => {
            if (lesson.type === 'video' && lesson.videoUrl) {
                const youtubeVideoId = this.extractVideoId(lesson.videoUrl);
                if (youtubeVideoId) {
                    return from(this.fetchVideoDuration(youtubeVideoId)).pipe(
                        map((isoDuration) => this.renderDuration(this.formatDuration(isoDuration))),
                        map((formattedDuration) => ({
                            ...lesson,
                            duration: formattedDuration,
                        })),
                        catchError(() => of(lesson)),
                    );
                }

                return this.resolveVideoDurationSeconds(lesson.videoUrl).pipe(
                    map((durationSeconds) => ({
                        ...lesson,
                        duration: durationSeconds > 0
                            ? this.formatVideoDurationLabel(durationSeconds)
                            : lesson.duration,
                    })),
                    catchError(() => of(lesson)),
                );
            }

            if (lesson.type === 'audio' && lesson.audioUrl) {
                return this.resolveAudioDurationSeconds(lesson.audioUrl).pipe(
                    map((durationSeconds) => ({
                        ...lesson,
                        duration: durationSeconds > 0
                            ? this.formatVideoDurationLabel(durationSeconds)
                            : lesson.duration,
                    })),
                    catchError(() => of(lesson)),
                );
            }

            return of(lesson);
        });

        return forkJoin(durationRequests);
    }

    private updateCachedCourseDuration(courseId: string, lessons: AcademyLesson[]): void {
        const courseIndex = this.academyCoursesCache.findIndex((course) => course.id === courseId);
        if (courseIndex === -1) {
            return;
        }

        const existingCourse = this.academyCoursesCache[courseIndex];
        const calculatedDuration = this.calculateCourseVideoDuration(lessons, '0m');

        if (calculatedDuration === existingCourse.duration) {
            return;
        }

        this.academyCoursesCache[courseIndex] = {
            ...existingCourse,
            duration: calculatedDuration,
        };
    }

    extractVideoId(url: string): string | null {
        return extractVideoId(url);
    }

    async fetchVideoDuration(videoId: string): Promise<string> {
        const apiKey = environment.youtubeDataApiKey.trim();
        if (!apiKey) {
            throw new Error('Missing YouTube API key.');
        }

        return fetchVideoDuration(videoId, apiKey);
    }

    formatDuration(isoDuration: string): string {
        return formatDuration(isoDuration);
    }

    renderDuration(duration: string): string {
        return renderDuration(duration);
    }

    private resolveVideoDurationSeconds(videoUrl: string): Observable<number> {
        return this.resolveMediaDurationSeconds(videoUrl, 'video');
    }

    private resolveAudioDurationSeconds(audioUrl: string): Observable<number> {
        return this.resolveMediaDurationSeconds(audioUrl, 'audio');
    }

    private resolveMediaDurationSeconds(
        mediaUrl: string,
        mediaType: 'video' | 'audio',
    ): Observable<number> {
        const cacheKey = `${mediaType}:${mediaUrl}`;
        const cachedDuration = this.mediaDurationSecondsCache.get(cacheKey);
        if (typeof cachedDuration === 'number') {
            return of(cachedDuration);
        }

        const pendingRequest = this.mediaDurationRequestCache.get(cacheKey);
        if (pendingRequest) {
            return pendingRequest;
        }

        const request$ = this.measureMediaDurationSeconds(mediaUrl, mediaType).pipe(
            tap((durationSeconds) => this.mediaDurationSecondsCache.set(cacheKey, durationSeconds)),
            catchError(() => of(0)),
            shareReplay(1),
        );

        this.mediaDurationRequestCache.set(cacheKey, request$);
        return request$;
    }

    private measureMediaDurationSeconds(
        mediaUrl: string,
        mediaType: 'video' | 'audio',
    ): Observable<number> {
        if (!this.isBrowser) {
            return of(0);
        }

        return this.measureHtmlMediaDurationSeconds(mediaUrl, mediaType);
    }

    private measureHtmlMediaDurationSeconds(
        mediaUrl: string,
        mediaType: 'video' | 'audio',
    ): Observable<number> {
        if (!this.isBrowser) {
            return of(0);
        }

        return new Observable<number>((observer) => {
            const mediaElement = globalThis.document.createElement(mediaType) as HTMLMediaElement;
            let settled = false;
            const timeoutId = globalThis.setTimeout(() => {
                completeWith(0);
            }, 15000);

            const cleanup = () => {
                globalThis.clearTimeout(timeoutId);
                mediaElement.removeAttribute('src');
                mediaElement.load();
            };

            const completeWith = (durationSeconds: number) => {
                if (settled) {
                    return;
                }

                settled = true;
                const normalizedDuration = Math.max(0, Math.round(durationSeconds));
                observer.next(normalizedDuration);
                observer.complete();
                cleanup();
            };

            const handleLoadedMetadata = () => {
                const rawDuration = Number.isFinite(mediaElement.duration)
                    ? mediaElement.duration
                    : 0;

                completeWith(Math.max(0, Math.round(rawDuration)));
            };

            const handleError = () => completeWith(0);

            mediaElement.preload = 'metadata';
            mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            mediaElement.addEventListener('error', handleError, { once: true });
            mediaElement.src = mediaUrl;
            mediaElement.load();

            return cleanup;
        });
    }

    private formatVideoDurationLabel(totalSeconds: number): string {
        const safeSeconds = Math.max(0, Math.round(totalSeconds));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const seconds = safeSeconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    private formatCourseDurationFromSeconds(totalSeconds: number): string {
        const roundedMinutes = Math.max(1, Math.round(totalSeconds / 60));
        const hours = Math.floor(roundedMinutes / 60);
        const minutes = roundedMinutes % 60;

        if (hours === 0) {
            return `${minutes}m`;
        }

        return `${hours}h ${minutes}m`;
    }

    private parseDurationLabelToSeconds(duration: string): number {
        const normalized = duration.trim().toLowerCase().replace(/^~\s*/, '');
        if (!normalized || normalized === 'assessment') {
            return 0;
        }

        const hhMmSsMatch = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(normalized);
        if (hhMmSsMatch) {
            if (typeof hhMmSsMatch[3] === 'string') {
                const hours = Number(hhMmSsMatch[1]);
                const minutes = Number(hhMmSsMatch[2]);
                const seconds = Number(hhMmSsMatch[3]);
                return (hours * 3600) + (minutes * 60) + seconds;
            }

            const minutes = Number(hhMmSsMatch[1]);
            const seconds = Number(hhMmSsMatch[2]);
            return (minutes * 60) + seconds;
        }

        if (normalized.includes('h') || normalized.includes('m')) {
            const hours = this.extractDurationUnit(normalized, 'h');
            const minutes = this.extractDurationUnit(normalized, 'm');

            if (hours > 0 || minutes > 0) {
                return (hours * 3600) + (minutes * 60);
            }
        }

        const minutesOnlyMatch = /^(\d+)\s*min(?:ute)?s?$/.exec(normalized);
        if (minutesOnlyMatch) {
            return Number(minutesOnlyMatch[1]) * 60;
        }

        return 0;
    }

    private extractDurationUnit(value: string, unit: 'h' | 'm'): number {
        const unitPattern = unit === 'h' ? /(\d+)\s*h/.exec(value) : /(\d+)\s*m/.exec(value);
        if (!unitPattern) {
            return 0;
        }

        const parsed = Number(unitPattern[1]);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return 0;
        }

        return parsed;
    }

    private getLocallyCompletedLessonIds(courseId: string): Set<string> {
        if (!this.isBrowser || !courseId) {
            return new Set<string>();
        }

        const storageKey = `${AcademyProgressService.localCompletedLessonsPrefix}${courseId}`;
        const storedValue = globalThis.localStorage.getItem(storageKey);
        if (!storedValue) {
            return new Set<string>();
        }

        try {
            const parsed = JSON.parse(storedValue) as unknown;
            if (!Array.isArray(parsed)) {
                return new Set<string>();
            }

            const lessonIds = parsed.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
            return new Set<string>(lessonIds);
        } catch {
            return new Set<string>();
        }
    }

    private markLocalLessonCompleted(courseId: string, lessonId: string): void {
        if (!this.isBrowser || !courseId || !lessonId) {
            return;
        }

        const completedLessonIds = this.getLocallyCompletedLessonIds(courseId);
        completedLessonIds.add(lessonId);

        const storageKey = `${AcademyProgressService.localCompletedLessonsPrefix}${courseId}`;
        globalThis.localStorage.setItem(storageKey, JSON.stringify(Array.from(completedLessonIds)));
        globalThis.localStorage.setItem(`${AcademyProgressService.localVideoCompletedPrefix}${lessonId}`, 'true');
    }

    private syncCompletedLessonLocally(courseId: string, lessonId: string): void {
        this.markLocalLessonCompleted(courseId, lessonId);
        this.ensureCourseEnrollmentCompletionStatus(courseId);
        this.invalidateProgressCache();
    }

    private isLegacyVideoCompletionRecorded(lessonId: string): boolean {
        if (!this.isBrowser || !lessonId) {
            return false;
        }

        const storageKey = `${AcademyProgressService.localVideoCompletedPrefix}${lessonId}`;
        return globalThis.localStorage.getItem(storageKey) === 'true';
    }

    private isCourseQuizPassedLocally(courseId: string): boolean {
        if (!this.isBrowser || !courseId) {
            return false;
        }

        const storageKey = `${AcademyProgressService.localQuizPassedPrefix}${courseId}`;
        return globalThis.localStorage.getItem(storageKey) === 'true';
    }

    private ensureCourseEnrollmentCompletionStatus(courseId: string): void {
        if (!courseId) {
            return;
        }

        this.getCurrentStudentId().pipe(
            take(1),
            switchMap((studentId) => {
                if (!studentId) {
                    return of(false);
                }

                return forkJoin({
                    enrollmentsByCourseId: this.getEnrollmentRecordsByCourseId(studentId).pipe(take(1)),
                    lessons: this.getAcademyLessons(courseId).pipe(take(1)),
                    quizzes: this.quizFacade.getAllQuizzes({
                        courseId,
                        pageNumber: 1,
                        pageSize: 200,
                    }).pipe(catchError(() => of([] as QuizReadDto[]))),
                }).pipe(
                    switchMap(({ enrollmentsByCourseId, lessons, quizzes }) => {
                        const enrollment = enrollmentsByCourseId.get(courseId);
                        const enrollmentId = typeof enrollment?.id === 'string'
                            ? enrollment.id
                            : '';

                        if (!enrollmentId) {
                            return of(false);
                        }

                        const currentStatus = this.parseEnrollmentStatus(enrollment?.status);
                        if (currentStatus === EnrollmentStatus.Completed) {
                            return of(false);
                        }

                        const shouldMarkEnrollmentCompleted = this.isCourseCompletionSatisfied(
                            courseId,
                            lessons,
                            quizzes,
                        );

                        if (!shouldMarkEnrollmentCompleted) {
                            return of(false);
                        }

                        return this.enrollmentFacade
                            .updateEnrollmentStatus(enrollmentId, EnrollmentStatus.Completed)
                            .pipe(catchError(() => of(false)));
                    }),
                );
            }),
            catchError(() => of(false)),
        ).subscribe({
            next: (updated) => {
                if (updated) {
                    this.invalidateProgressCache();
                }
            },
            error: () => void 0,
        });
    }

    private isCourseCompletionSatisfied(
        courseId: string,
        lessons: AcademyLesson[],
        quizzes: QuizReadDto[],
    ): boolean {
        const hasAnyCourseItems = lessons.length > 0 || quizzes.length > 0;
        if (!hasAnyCourseItems) {
            return false;
        }

        const completedLessonIds = this.getLocallyCompletedLessonIds(courseId);
        const nonQuizLessons = lessons.filter((lesson) => lesson.type !== 'quiz');
        const quizLessons = lessons.filter((lesson) => lesson.type === 'quiz');

        const allNonQuizLessonsCompleted = nonQuizLessons.every((lesson) => completedLessonIds.has(lesson.id));
        const allQuizLessonsCompleted = quizLessons.every((lesson) => completedLessonIds.has(lesson.id));

        const hasCourseLevelQuiz = quizzes.some((quiz) => {
            const lessonId = typeof quiz.lessonId === 'string' ? quiz.lessonId.trim() : '';
            return lessonId.length === 0;
        });
        const hasAnyQuiz = quizLessons.length > 0 || quizzes.length > 0;
        const hasPassedCourseQuiz = this.isCourseQuizPassedLocally(courseId);

        const areQuizRequirementsSatisfied = !hasAnyQuiz
            || (
                (quizLessons.length === 0 || allQuizLessonsCompleted)
                && (!hasCourseLevelQuiz || hasPassedCourseQuiz)
            );

        return allNonQuizLessonsCompleted && areQuizRequirementsSatisfied;
    }

    private resolveStudentId(profile: StudentProfile | null): string | undefined {
        const candidates = [profile?.studentId, profile?.id, profile?.userId];

        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate;
            }
        }

        return undefined;
    }

    private getCurrentStudentId(): Observable<string | undefined> {
        return this.studentFacade.getMyProfileFromApi().pipe(
            switchMap((profile) => {
                const resolvedStudentId = this.resolveStudentId(profile);
                if (resolvedStudentId) {
                    return of(resolvedStudentId);
                }

                return this.studentFacade.me().pipe(
                    map((fallbackProfile) => this.resolveStudentId(fallbackProfile)),
                    take(1),
                    catchError(() => of(undefined)),
                );
            }),
            catchError(() =>
                this.studentFacade.me().pipe(
                    map((profile) => this.resolveStudentId(profile)),
                    take(1),
                )
            ),
        );
    }

    private createEmptyEnrollmentState(): CourseEnrollmentState {
        return {
            enrollmentId: null,
            status: null,
            isEnrolled: false,
            isCompleted: false,
        };
    }

    private resolveCourseEnrollmentState(enrollment: EnrollmentReadDto | undefined): CourseEnrollmentState {
        if (!enrollment) {
            return this.createEmptyEnrollmentState();
        }

        const parsedStatus = this.parseEnrollmentStatus(enrollment.status);

        return {
            enrollmentId: typeof enrollment.id === 'string' ? enrollment.id : null,
            status: parsedStatus,
            isEnrolled: this.isEnrollmentConsideredEnrolled(enrollment.status),
            isCompleted: parsedStatus === EnrollmentStatus.Completed,
        };
    }

    private parseEnrollmentStatus(value: unknown): EnrollmentStatus | null {
        if (typeof value === 'number') {
            return this.normalizeNumericEnrollmentStatus(value);
        }

        if (typeof value !== 'string') {
            return null;
        }

        const normalized = value.trim().toLowerCase();
        switch (normalized) {
            case '1':
            case 'active':
                return EnrollmentStatus.Active;
            case '2':
            case 'completed':
                return EnrollmentStatus.Completed;
            case '3':
            case 'cancelled':
            case 'canceled':
                return EnrollmentStatus.Cancelled;
            case '4':
            case 'paused':
                return EnrollmentStatus.Paused;
            default:
                return null;
        }
    }

    private normalizeNumericEnrollmentStatus(value: number): EnrollmentStatus | null {
        switch (value) {
            case EnrollmentStatus.Active:
            case EnrollmentStatus.Completed:
            case EnrollmentStatus.Cancelled:
            case EnrollmentStatus.Paused:
                return value;
            default:
                return null;
        }
    }

    private isEnrollmentConsideredEnrolled(value: unknown): boolean {
        const status = this.parseEnrollmentStatus(value);
        return status === EnrollmentStatus.Active
            || status === EnrollmentStatus.Completed
            || status === EnrollmentStatus.Paused;
    }

    private getEnrollmentStatusPriority(value: unknown): number {
        const status = this.parseEnrollmentStatus(value);

        switch (status) {
            case EnrollmentStatus.Completed:
                return 4;
            case EnrollmentStatus.Active:
                return 3;
            case EnrollmentStatus.Paused:
                return 2;
            case EnrollmentStatus.Cancelled:
                return 1;
            default:
                return 0;
        }
    }

    private invalidateProgressCache(): void {
        this.studentProgressRequest$ = null;
        
        if (this.isProgressInitialized) {
            this.isRefreshingProgressSubject.next(true);
            this.getStudentProgress(true).pipe(
                take(1),
                finalize(() => this.isRefreshingProgressSubject.next(false))
            ).subscribe();
        }
    }
}

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, of, forkJoin, from } from 'rxjs';
import { map, catchError, tap, switchMap, shareReplay } from 'rxjs/operators';
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
import { CourseFacade, CourseReadDto } from '../../api/facades/course.facade';
import { LevelFacade, LevelReadDto } from '../../api/facades/level.facade';
import { StudentFacade } from '../../api/facades/student.facade';
import { EnrollmentFacade } from '../../api/facades/enrollment.facade';
import { toApiMediaUrl } from '../helpers/media-url.helper';
import { environment } from '../../../environments/environment';
import {
    extractVideoId,
    fetchVideoDuration,
    formatDuration,
    renderDuration,
} from '../helpers/youtube-duration.helper';

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

    private readonly progressFacade = inject(ProgressFacade);
    private readonly lessonProgressFacade = inject(LessonProgressFacade);
    private readonly lessonFacade = inject(LessonFacade);
    private readonly courseFacade = inject(CourseFacade);
    private readonly levelFacade = inject(LevelFacade);
    private readonly studentFacade = inject(StudentFacade);
    private readonly enrollmentFacade = inject(EnrollmentFacade);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    private readonly progressSubject = new BehaviorSubject<StudentProgress | null>(null);
    readonly progress$ = this.progressSubject.asObservable();
    private academyCoursesCache: AcademyCourse[] = [];
    private academyStagesCache: AcademyStageApi[] = [];
    private academyStagesRequest$: Observable<AcademyStageApi[]> | null = null;
    private academyCoursesRequest$: Observable<AcademyCourse[]> | null = null;
    private studentProgressRequest$: Observable<StudentProgress> | null = null;
    private readonly lessonsCache = new Map<string, AcademyLesson[]>();
    private readonly videoDurationSecondsCache = new Map<string, number>();
    private readonly videoDurationRequestCache = new Map<string, Observable<number>>();

    constructor() {
        this.initializeProgress();
    }

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
                    switchMap(student => this.buildProgressForStudent(courses, student?.id)),
                    catchError(() => of(this.buildStudentProgress('anonymous', courses, new Set<string>(), null, [])))
                )
            ),
            tap(progress => this.progressSubject.next(progress)),
            shareReplay(1)
        );

        return this.studentProgressRequest$;
    }

    private buildProgressForStudent(courses: AcademyCourse[], studentId?: string): Observable<StudentProgress> {
        if (!studentId) {
            return of(this.buildStudentProgress('anonymous', courses, new Set<string>(), null, []));
        }

        return forkJoin({
            enrolledCourseIds: this.getEnrolledCourseIds(studentId),
            progressRecords: this.getCourseProgressRecords(courses),
        }).pipe(
            switchMap(({ enrolledCourseIds, progressRecords }) =>
                this.resolveRecentLesson(courses, enrolledCourseIds, progressRecords).pipe(
                    map((recentLesson) => this.buildStudentProgress(
                        studentId,
                        courses,
                        enrolledCourseIds,
                        recentLesson,
                        progressRecords,
                    )),
                ),
            ),
            catchError(() => of(this.buildStudentProgress(studentId, courses, new Set<string>(), null, []))),
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

    private getEnrolledCourseIds(studentId: string): Observable<Set<string>> {
        return this.enrollmentFacade.getEnrolledCoursesByStudent(studentId).pipe(
            map(enrollments => {
                const ids = enrollments
                    .map(item => item.courseId)
                    .filter((courseId): courseId is string => typeof courseId === 'string' && courseId.length > 0);
                return new Set(ids);
            })
        );
    }

    /**
     * Get recent lesson for "Continue Learning" button.
     * Derived from the full student progress response.
     */
    getRecentLesson(): Observable<RecentLessonInfo | null> {
        return this.getStudentProgress().pipe(map((progress) => progress.recentLesson));
    }

    /**
     * Get stage progress for all stages
     */
    getStageProgress(): Observable<StageProgress[]> {
        return this.getStudentProgress().pipe(map((progress) => progress.stageProgress));
    }

    /**
     * Check if a specific stage is unlocked
     */
    isStageUnlocked(stageNumber: number): Observable<boolean> {
        return this.getStudentProgress().pipe(
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
        return this.getStudentProgress().pipe(
            map((progress) => progress.courseProgress.find((c) => c.courseId === courseId))
        );
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
                    this.courseFacade.getCoursesByLevel(stage.id).pipe(
                        map(courses => courses
                            .filter((course) => {
                                const isPublished = course['isPublished'];
                                return isPublished !== false;
                            })
                            .map((course) => this.mapCourseDtoToAcademyCourse(course, stage.id, stage.number))
                        ),
                        catchError(() => of([] as AcademyCourse[]))
                    )
                );
                return forkJoin(courseRequests).pipe(
                    map(coursesByLevel => coursesByLevel.flat())
                );
            }),
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
        return this.courseFacade.getCoursesByLevel(levelId).pipe(
            map(courses => courses
                .filter((course) => {
                    const isPublished = course['isPublished'];
                    return isPublished !== false;
                })
                .map(c => this.mapCourseDtoToAcademyCourse(c, levelId, stageNumber))
            ),
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
        const totalVideoSeconds = lessons
            .filter((lesson) => lesson.type === 'video')
            .reduce((total, lesson) => total + this.parseDurationLabelToSeconds(lesson.duration), 0);

        if (totalVideoSeconds <= 0) {
            return fallbackDuration;
        }

        return this.formatCourseDurationFromSeconds(totalVideoSeconds);
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
                    if (request.isCompleted) {
                        this.markLocalLessonCompleted(request.courseId, request.lessonId);
                    }

                    this.invalidateProgressCache();
                    return this.buildLessonProgress(request.lessonId, request.courseId, !!request.isCompleted);
                }),
                catchError(() => {
                    if (request.isCompleted) {
                        this.markLocalLessonCompleted(request.courseId, request.lessonId);
                    }

                    this.invalidateProgressCache();
                    return of(this.buildLessonProgress(request.lessonId, request.courseId, !!request.isCompleted));
                }),
            );
    }

    /**
     * Mark lesson as completed.
     */
    markLessonCompleted(lessonId: string, courseId: string): Observable<LessonProgress> {
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
        enrolledCourseIds: Set<string>,
        recentLesson: RecentLessonInfo | null,
        progressRecords: ProgressReadDto[],
    ): StudentProgress {
        const sortedStageIds = Array.from(new Set(courses.map(course => course.stageId))).sort((a, b) => a - b);
        const unlockedStageIds = new Set<number>(sortedStageIds);
        const progressRecordByCourseId = this.normalizeProgressRecords(progressRecords);

        const courseProgressById = new Map<string, CourseProgress>();
        const sortedCourses = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const courseProgress = sortedCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(String(course.id));
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

            const apiProgress = progressRecordByCourseId.get(course.id);
            const normalizedProgress = apiProgress
                ? this.normalizeProgressPercentage(apiProgress.lessonCompletionRate ?? apiProgress.progress ?? 0)
                : 0;
            const apiCompletedLessons = apiProgress && typeof apiProgress.totalLessonsCompleted === 'number'
                ? Math.max(0, apiProgress.totalLessonsCompleted)
                : 0;
            const isApiCompleted = !!apiProgress?.completedProgress || !!apiProgress?.isCompleted;
            const locallyCompletedLessons = this.getLocallyCompletedLessonIds(course.id).size;
            const completedLessonsCount = Math.max(apiCompletedLessons, locallyCompletedLessons);
            const completionRateFromLessons = course.lessons > 0
                ? this.normalizeProgressPercentage((completedLessonsCount / course.lessons) * 100)
                : 0;
            const effectiveProgress = isApiCompleted
                ? 100
                : Math.max(normalizedProgress, completionRateFromLessons);
            const quizPassed = isApiCompleted || this.isCourseQuizPassedLocally(course.id);
            const completedByRule = completedLessonsCount >= course.lessons && quizPassed;
            const isCourseCompleted = isApiCompleted || completedByRule;

            if (isCourseCompleted) {
                status = 'completed';
            } else if (effectiveProgress > 0) {
                status = 'in-progress';
            }

            const progressEntry: CourseProgress = {
                courseId: course.id,
                status,
                progress: isCourseCompleted ? 100 : effectiveProgress,
                completedLessons: isCourseCompleted
                    ? Math.max(course.lessons, completedLessonsCount)
                    : Math.min(course.lessons, completedLessonsCount),
                totalLessons: course.lessons,
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
        const targetCourse = inProgressFromApi ?? enrolledCourse ?? fallbackCourse;

        if (!targetCourse) {
            return of(null);
        }

        return this.getAcademyLessons(String(targetCourse.id)).pipe(
            map((lessons) => {
                const firstLesson = lessons[0];
                if (!firstLesson) {
                    return null;
                }

                return {
                    stageNumber: targetCourse.stageId,
                    courseId: targetCourse.id,
                    courseName: targetCourse.title,
                    lessonId: firstLesson.id,
                    lessonNumber: firstLesson.order,
                    lessonTitle: firstLesson.title,
                    thumbnailUrl: targetCourse.thumbnailUrl ?? '',
                    progress: 0,
                    currentTime: '0:00',
                    totalTime: firstLesson.duration,
                    completedLessons: 0,
                    totalLessons: targetCourse.lessons,
                };
            }),
            catchError(() => of(null))
        );
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
            prerequisites: [
                ...(course.prerequisites?.map(p => p.id ?? '').filter(id => id !== '') ?? []),
                ...(course.prerequisiteIds ?? [])
            ]
        };
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
        const normalizedVideoUrl = toApiMediaUrl(
            lesson.externalVideoUrl ?? lesson.videoUrl ?? lesson.contentUrl ?? null,
        ) ?? undefined;

        return {
            id,
            courseId,
            title,
            isPublished: lesson.isPublished,
            duration: this.resolveLessonDurationFromDto(lesson, type),
            videoUrl: type === 'video' ? normalizedVideoUrl : undefined,
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
            return 'Course';
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

        if (type !== 'video') {
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
            if (lesson.type !== 'video' || !lesson.videoUrl) {
                return of(lesson);
            }

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
        const cachedDuration = this.videoDurationSecondsCache.get(videoUrl);
        if (typeof cachedDuration === 'number') {
            return of(cachedDuration);
        }

        const pendingRequest = this.videoDurationRequestCache.get(videoUrl);
        if (pendingRequest) {
            return pendingRequest;
        }

        const request$ = this.measureVideoDurationSeconds(videoUrl).pipe(
            tap((durationSeconds) => this.videoDurationSecondsCache.set(videoUrl, durationSeconds)),
            catchError(() => of(0)),
            shareReplay(1),
        );

        this.videoDurationRequestCache.set(videoUrl, request$);
        return request$;
    }

    private measureVideoDurationSeconds(videoUrl: string): Observable<number> {
        if (!this.isBrowser) {
            return of(0);
        }

        return this.measureHtmlVideoDurationSeconds(videoUrl);
    }

    private measureHtmlVideoDurationSeconds(videoUrl: string): Observable<number> {
        if (!this.isBrowser) {
            return of(0);
        }

        return new Observable<number>((observer) => {
            const mediaElement = globalThis.document.createElement('video');
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
            mediaElement.src = videoUrl;
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
        const normalized = duration.trim().toLowerCase();
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

    private invalidateProgressCache(): void {
        this.studentProgressRequest$ = null;
    }
}

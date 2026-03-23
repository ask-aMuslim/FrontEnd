import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
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
import { ProgressFacade } from '../../api/facades/progress.facade';
import { LessonFacade, LessonReadDto } from '../../api/facades/lesson.facade';
import { CourseFacade, CourseReadDto } from '../../api/facades/course.facade';
import { LevelFacade, LevelReadDto } from '../../api/facades/level.facade';
import { StudentFacade } from '../../api/facades/student.facade';
import { EnrollmentFacade } from '../../api/facades/enrollment.facade';
import { toApiMediaUrl } from '../helpers/media-url.helper';

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
    private readonly progressFacade = inject(ProgressFacade);
    private readonly lessonFacade = inject(LessonFacade);
    private readonly courseFacade = inject(CourseFacade);
    private readonly levelFacade = inject(LevelFacade);
    private readonly studentFacade = inject(StudentFacade);
    private readonly enrollmentFacade = inject(EnrollmentFacade);

    private readonly progressSubject = new BehaviorSubject<StudentProgress | null>(null);
    readonly progress$ = this.progressSubject.asObservable();
    private academyCoursesCache: AcademyCourse[] = [];
    private academyStagesCache: AcademyStageApi[] = [];
    private academyStagesRequest$: Observable<AcademyStageApi[]> | null = null;
    private academyCoursesRequest$: Observable<AcademyCourse[]> | null = null;
    private studentProgressRequest$: Observable<StudentProgress> | null = null;
    private readonly lessonsCache = new Map<string, AcademyLesson[]>();

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
                    catchError(() => of(this.buildStudentProgress('anonymous', courses, new Set<string>(), null)))
                )
            ),
            tap(progress => this.progressSubject.next(progress)),
            shareReplay(1)
        );

        return this.studentProgressRequest$;
    }

    private buildProgressForStudent(courses: AcademyCourse[], studentId?: string): Observable<StudentProgress> {
        if (!studentId) {
            return of(this.buildStudentProgress('anonymous', courses, new Set<string>(), null));
        }

        return this.getEnrolledCourseIds(studentId).pipe(
            switchMap(enrolledCourseIds =>
                this.resolveRecentLesson(courses, enrolledCourseIds).pipe(
                    map(recentLesson => this.buildStudentProgress(studentId, courses, enrolledCourseIds, recentLesson))
                )
            ),
            catchError(() => of(this.buildStudentProgress(studentId, courses, new Set<string>(), null)))
        );
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
                        map(courses => courses.map(c => this.mapCourseDtoToAcademyCourse(c, undefined, 1)))
                    );
                }
                const courseRequests = stages.map(stage =>
                    this.courseFacade.getRoadmap(stage.id).pipe(
                        map(courses => this.mapCoursesForStage(courses as any[], stage.id, stage.number)),
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
        return this.courseFacade.getRoadmap(levelId).pipe(
            map(courses => courses.map(c => this.mapCourseDtoToAcademyCourse(c as any, levelId, stageNumber))),
            catchError(() => of([]))
        );
    }

    getAcademyCourseById(courseId: string): Observable<AcademyCourse> {
        return this.courseFacade.getCourseById(courseId).pipe(
            map(course => {
                if (!course) {
                    return {
                        id: courseId,
                        stageId: 1,
                        levelId: '',
                        title: 'Unknown Course',
                        category: 'social-topics' as const,
                        categoryLabel: 'C: Social Topics',
                        lessons: 0,
                        duration: '0m',
                    };
                }
                return this.mapCourseDtoToAcademyCourse(course, course.levelId, 1);
            }),
            tap(course => {
                const index = this.academyCoursesCache.findIndex(existing => existing.id === course.id);
                if (index === -1) {
                    this.academyCoursesCache.push(course);
                    return;
                }
                this.academyCoursesCache[index] = course;
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
            map(lessons => lessons.map((lesson, index) => this.mapLessonDtoToAcademyLesson(lesson, courseId, index))),
            tap(lessons => { this.lessonsCache.set(courseId, lessons); }),
            catchError(() => of([]))
        );
    }

    /**
     * Get lessons for a specific course with their progress.
     * Uses API lessons and derives an initial progress projection.
     */
    getCourseLessonsWithProgress(courseId: string): Observable<(AcademyLesson & { progress: LessonProgress })[]> {
        return this.getAcademyLessons(courseId).pipe(
            map(apiLessons =>
                apiLessons.map((apiLesson, index) => ({
                    ...apiLesson,
                    progress: {
                        lessonId: apiLesson.id,
                        courseId,
                        status: index === 0 ? 'current' : 'available',
                        isCompleted: false,
                    },
                }))
            )
        );
    }

    /**
     * Update lesson progress.
     * Persists completion and watch position through lesson progress APIs.
     */
    updateLessonProgress(request: UpdateLessonProgressRequest): Observable<LessonProgress> {
        if (request.isCompleted) {
            return this.lessonFacade.saveProgress(request.lessonId, {
                completed: true,
                currentTime: request.lastPosition,
            }).pipe(
                map(() => {
                    this.invalidateProgressCache();
                    return this.buildLessonProgress(request.lessonId, request.courseId, true);
                })
            );
        }

        if (request.watchTime !== undefined || request.lastPosition !== undefined) {
            return this.lessonFacade.saveProgress(request.lessonId, {
                completed: false,
                currentTime: request.lastPosition,
            }).pipe(
                map(() => {
                    this.invalidateProgressCache();
                    return this.buildLessonProgress(request.lessonId, request.courseId, false);
                })
            );
        }

        return of(this.buildLessonProgress(request.lessonId, request.courseId, false));
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
    ): StudentProgress {
        const sortedStageIds = Array.from(new Set(courses.map(course => course.stageId))).sort((a, b) => a - b);
        const firstStageWithCourses = sortedStageIds[0];
        const unlockedStageIds = new Set<number>(
            firstStageWithCourses !== undefined ? [firstStageWithCourses] : []
        );

        const courseProgress = courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(String(course.id));
            const isUnlocked = unlockedStageIds.has(course.stageId);
            let status: CourseStatus = 'locked';
            if (isUnlocked) {
                status = 'available';
            }
            if (isEnrolled) {
                status = 'in-progress';
            }

            return {
                courseId: course.id,
                status,
                progress: 0,
                completedLessons: 0,
                totalLessons: course.lessons,
                quizPassed: false,
            };
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

    private resolveRecentLesson(courses: AcademyCourse[], enrolledCourseIds: Set<string>): Observable<RecentLessonInfo | null> {
        const fallbackCourse = courses[0];
        const enrolledCourse = courses.find(course => enrolledCourseIds.has(String(course.id)));
        const targetCourse = enrolledCourse ?? fallbackCourse;

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

    private mapCoursesForStage(courses: CourseReadDto[], levelId: string, stageNumber: number): AcademyCourse[] {
        return courses.map((course) => this.mapCourseDtoToAcademyCourse(course, levelId, stageNumber));
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
        const lessons = course.numberOfLessons ?? 0;

        return {
            id,
            stageId: stageNumber,
            levelId: levelId ?? course.levelId ?? '',
            title,
            category: 'social-topics', // all API courses map to the same neutral category by default
            categoryLabel: 'Course',
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

    private mapLessonDtoToAcademyLesson(
        lesson: LessonReadDto,
        courseId: string,
        index: number,
    ): AcademyLesson {
        const id = lesson.id ?? '';
        const title = lesson.title ?? `Lesson ${index + 1}`;
        const type = this.mapLessonType(lesson, index);

        return {
            id,
            courseId,
            title,
            duration: '10 min',
            type,
            order: lesson.order ?? (index + 1),
            description: lesson.content ?? undefined,
        };
    }

    private mapLessonType(lesson: LessonReadDto, index: number): AcademyLesson['type'] {
        const content = (lesson.content ?? '').toLowerCase();

        if (index === 0 || content.includes('intro')) {
            return 'intro';
        }

        if (content.includes('quiz')) {
            return 'quiz';
        }

        if (content.includes('article') || content.includes('text')) {
            return 'article';
        }

        if (lesson.videoUrl || lesson.externalVideoUrl) {
            return 'video';
        }

        return 'video';
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

    private invalidateProgressCache(): void {
        this.studentProgressRequest$ = null;
    }
}

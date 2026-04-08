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
import { CourseFacade, CourseReadDto, RoadmapCourseDto } from '../../api/facades/course.facade';
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
                    this.courseFacade.getRoadmap(stage.id).pipe(
                        map(courses => this.mapCoursesForStage(courses, stage.id, stage.number)),
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
            map(courses => courses
                .filter((course) => {
                    const isPublished = course['isPublished'];
                    return isPublished !== false;
                })
                .map(c => this.mapRoadmapCourseToAcademyCourse(c, levelId, stageNumber))
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
        const unlockedStageIds = new Set<number>(sortedStageIds);

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

            const progressEntry: CourseProgress = {
                courseId: course.id,
                status,
                progress: 0,
                completedLessons: 0,
                totalLessons: course.lessons,
                quizPassed: false,
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

    private mapCoursesForStage(courses: RoadmapCourseDto[], levelId: string, stageNumber: number): AcademyCourse[] {
        return courses
            .filter(course => course['isPublished'] !== false)
            .map((course) => this.mapRoadmapCourseToAcademyCourse(course, levelId, stageNumber));
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

    private mapRoadmapCourseToAcademyCourse(
        course: RoadmapCourseDto,
        levelId: string,
        stageNumber: number,
    ): AcademyCourse {
        const id = course.id ?? '';
        const title = course.title ?? 'Untitled course';
        const lessons = this.resolveLessonCount(course);
        const categoryValue = course['category'];
        const category = this.mapCourseCategory(categoryValue);
        const isPublished = typeof course['isPublished'] === 'boolean' ? course['isPublished'] : undefined;

        return {
            id,
            stageId: stageNumber,
            levelId: levelId || course.levelId || '',
            title,
            isPublished,
            category,
            categoryLabel: this.buildCategoryLabel(categoryValue),
            lessons,
            duration: this.buildDurationText(lessons),
            thumbnailUrl: toApiMediaUrl(course.thumbnailUrl ?? null) ?? undefined,
            description: course.description ?? undefined,
            order: course.order,
            prerequisites: [
                ...(course.prerequisites?.map(p => p.id ?? '').filter(id => id !== '') ?? []),
                ...(course.prerequisiteIds ?? []),
            ],
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

        return {
            id,
            courseId,
            title,
            isPublished: lesson.isPublished,
            duration: '10 min',
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
            !!lesson.externalVideoUrl
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

    private invalidateProgressCache(): void {
        this.studentProgressRequest$ = null;
    }
}

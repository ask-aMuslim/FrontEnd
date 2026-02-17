import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { AcademyMockDataService } from './mock-data/academy-mock-data.service';
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
    CourseStatus,
    LessonStatus,
} from '../models/interfaces/academy-progress.model';
import { ProgressFacade, ProgressReadDto } from '../../api/facades/progress.facade';
import { LessonFacade, LessonReadDto } from '../../api/facades/lesson.facade';
import { CourseFacade, CourseReadDto, CourseReadByIdDto } from '../../api/facades/course.facade';
import { StudentFacade } from '../../api/facades/student.facade';
import { toApiMediaUrl } from '../helpers/media-url.helper';

// Re-export for backward compatibility
export { ACADEMY_STAGES } from './mock-data/academy-seed-data';
export { ACADEMY_COURSES } from './mock-data/academy-seed-data';
export { ACADEMY_LESSONS } from './mock-data/academy-seed-data';
export type { AcademyStage } from './mock-data/academy-seed-data';

const CATEGORY_LABELS: Record<CourseStatus | 'unknown', string> = {
    completed: 'A: Main Believes',
    'in-progress': 'A: Main Believes',
    locked: 'A: Main Believes',
    available: 'A: Main Believes',
    unknown: 'A: Main Believes',
};

const MAIN_BELIEVES_CATEGORIES = new Set(['Aqeeda', 'Faith', 'Quran']);
const MODELS_STORIES_CATEGORIES = new Set(['Seerah', 'BiographyOfProphets', 'Hadith']);
const LEVEL_TO_STAGE: Record<string, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
    AllLevels: 1,
};

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
 * - ProgressFacade: Course-level progress (API-backed)
 * - LessonFacade: Lesson-level progress via legacy endpoints
 * - StudentFacade: Current student identity
 * - AcademyMockDataService: Fallback for unsupported operations
 *   (stage progress, lesson-level watch tracking, quiz evaluation)
 *
 * Sync methods (getCourseById, getLessonById, etc.) use seed data for
 * instant rendering. Async methods try API first with mock fallback.
 */
@Injectable({
    providedIn: 'root',
})
export class AcademyProgressService {
    private readonly progressFacade = inject(ProgressFacade);
    private readonly lessonFacade = inject(LessonFacade);
    private readonly courseFacade = inject(CourseFacade);
    private readonly studentFacade = inject(StudentFacade);
    private readonly mockDataService = inject(AcademyMockDataService);

    private readonly progressSubject = new BehaviorSubject<StudentProgress | null>(null);
    readonly progress$ = this.progressSubject.asObservable();
    private academyCoursesCache: AcademyCourse[] = [];
    private readonly lessonsCache = new Map<string, AcademyLesson[]>();

    constructor() {
        this.initializeProgress();
    }

    private initializeProgress(): void {
        this.mockDataService.getStudentProgress().subscribe(progress => {
            this.progressSubject.next(progress);
        });
    }

    /**
     * Get complete student progress.
     * Attempts API-backed progress merge; falls back to mock data.
     */
    getStudentProgress(): Observable<StudentProgress> {
        return this.studentFacade.me().pipe(
            switchMap(student => {
                const studentId = student?.id;
                if (!studentId) {
                    return this.mockDataService.getStudentProgress();
                }
                return this.progressFacade.getProgressByStudentId(studentId).pipe(
                    switchMap(apiProgress =>
                        this.mockDataService.getStudentProgress().pipe(
                            map(mockProgress => this.mergeApiProgressIntoMock(mockProgress, apiProgress))
                        )
                    ),
                    catchError(() => this.mockDataService.getStudentProgress())
                );
            }),
            catchError(() => this.mockDataService.getStudentProgress()),
            tap(progress => this.progressSubject.next(progress))
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
     * Get all courses for a specific stage with their progress
     */
    getStageCoursesWithProgress(stageNumber: number): Observable<(AcademyCourse & { progress: CourseProgress })[]> {
        return this.getStudentProgress().pipe(
            switchMap((progress) =>
                this.getAcademyCourses().pipe(
                    map((courses) => {
                        const stageCourses = courses.filter((course) => course.stageId === stageNumber);
                        return stageCourses.map((course) => this.withCourseProgress(course, progress.courseProgress));
                    })
                )
            )
        );
    }

    /**
     * Get lessons for a specific course with their progress.
     * Tries LessonFacade for lesson list, merges with mock progress data.
     */
    getCourseLessonsWithProgress(courseId: string): Observable<(AcademyLesson & { progress: LessonProgress })[]> {
        return this.getAcademyLessons(courseId).pipe(
            switchMap(apiLessons =>
                this.mockDataService.getCourseLessonsWithProgress(courseId).pipe(
                    map(mockLessons => this.mergeApiLessonsWithProgress(apiLessons, mockLessons, courseId))
                )
            )
        );
    }

    getAcademyCourses(forceRefresh = false): Observable<AcademyCourse[]> {
        return this.courseFacade.getAllCourses().pipe(
            map(courses => courses.map(course => this.mapCourseDtoToAcademyCourse(course))),
            tap(courses => {
                this.academyCoursesCache = courses;
            })
        );
    }

    getAcademyCourseById(courseId: string): Observable<AcademyCourse> {
        return this.courseFacade.getCourseById(courseId).pipe(
            map(course => {
                if (!course) {
                    // Return a default course if not found
                    return {
                        id: courseId,
                        stageId: 1,
                        title: 'Unknown Course',
                        category: 'social-topics' as const,
                        categoryLabel: 'C: Social Topics',
                        lessons: 0,
                        duration: '0m',
                    };
                }
                return this.mapCourseByIdDtoToAcademyCourse(course);
            }),
            tap(course => {
                const index = this.academyCoursesCache.findIndex(existing => existing.id === course.id);
                if (index === -1) {
                    this.academyCoursesCache.push(course);
                    return;
                }
                this.academyCoursesCache[index] = course;
            })
        );
    }

    getAcademyLessons(courseId: string, forceRefresh = false): Observable<AcademyLesson[]> {
        return this.lessonFacade.getCourseLessons(courseId).pipe(
            map(lessons => lessons.map((lesson, index) => this.mapLessonDtoToAcademyLesson(lesson, courseId, index))),
            tap(lessons => {
                this.lessonsCache.set(courseId, lessons);
            })
        );
    }

    /**
     * Update lesson progress.
     * Tries LessonFacade.saveProgress for completion; falls back to mock.
     */
    updateLessonProgress(request: UpdateLessonProgressRequest): Observable<LessonProgress> {
        if (request.isCompleted) {
            return this.lessonFacade.saveProgress(request.lessonId, {
                completed: true,
                currentTime: request.lastPosition,
            }).pipe(
                map(() => this.buildLessonProgress(request.lessonId, request.courseId, true)),
                catchError(() => this.mockDataService.markLessonCompleted(request.lessonId, request.courseId))
            );
        }

        if (request.watchTime !== undefined || request.lastPosition !== undefined) {
            return this.lessonFacade.saveProgress(request.lessonId, {
                completed: false,
                currentTime: request.lastPosition,
            }).pipe(
                map(() => this.buildLessonProgress(request.lessonId, request.courseId, false)),
                catchError(() => this.mockDataService.updateLessonWatchProgress(
                    request.lessonId,
                    request.courseId,
                    request.watchTime ?? 0,
                    request.lastPosition ?? 0
                ))
            );
        }

        return this.mockDataService.getCourseLessonsWithProgress(request.courseId).pipe(
            map(lessons => {
                const lesson = lessons.find(l => l.id === request.lessonId);
                return lesson?.progress ?? this.buildLessonProgress(request.lessonId, request.courseId, false);
            })
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

    /**
     * Submit quiz result and potentially unlock next stage.
     * No quiz evaluation endpoint exists yet — mock only.
     */
    submitQuizResult(request: SubmitQuizResultRequest): Observable<StageQuizResult> {
        return this.mockDataService.submitQuizResult(
            request.courseId,
            request.score,
            request.passed
        ).pipe(
            map(result => ({
                stageNumber: request.stageNumber,
                score: result.score,
                passed: result.passed,
                nextStageUnlocked: result.nextCourseUnlocked,
            }))
        );
    }

    /**
     * Get static course data by ID
     */
    getCourseById(courseId: string): AcademyCourse | undefined {
        return this.academyCoursesCache.find(course => course.id === courseId);
    }

    /**
     * Get static lesson data by ID
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
     * Get lessons for a course
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

    /**
     * Merge API progress records into the mock StudentProgress structure.
     * Updates courseProgress entries with real data from the backend while
     * preserving stage/lesson progress from mock (no API equivalent yet).
     */
    private mergeApiProgressIntoMock(
        mockProgress: StudentProgress,
        apiRecords: ProgressReadDto[]
    ): StudentProgress {
        if (!apiRecords?.length) {
            return mockProgress;
        }

        const updatedCourseProgress = mockProgress.courseProgress.map(cp => {
            const apiRecord = apiRecords.find(r => r.courseId === cp.courseId);
            if (!apiRecord) {
                return cp;
            }
            const completedLessons = apiRecord.totalLessonsCompleted ?? cp.completedLessons;
            const totalLessons = cp.totalLessons || 1;
            const lessonCompletionRate = apiRecord.lessonCompletionRate;
            const hasLessonCompletionRate = typeof lessonCompletionRate === 'number';
            const progressPercent = hasLessonCompletionRate
                ? Math.round(lessonCompletionRate * 100)
                : Math.round((completedLessons / totalLessons) * 100);

            let status: CourseStatus = cp.status;
            if (apiRecord.isCompleted) {
                status = 'completed';
            } else if (completedLessons > 0) {
                status = 'in-progress';
            }

            return {
                ...cp,
                completedLessons,
                progress: progressPercent,
                status,
                quizPassed: apiRecord.isCertified ?? cp.quizPassed,
            };
        });

        return { ...mockProgress, courseProgress: updatedCourseProgress };
    }

    /**
     * Merge API lesson list with mock progress data.
     * Uses API lesson metadata while preserving local progress state.
     */
    private mergeApiLessonsWithProgress(
        apiLessons: AcademyLesson[],
        mockLessons: (AcademyLesson & { progress: LessonProgress })[],
        courseId: string
    ): (AcademyLesson & { progress: LessonProgress })[] {
        return apiLessons.map((apiLesson, index) => {
            const mockLesson = mockLessons.find(item => item.id === apiLesson.id);
            return {
                ...apiLesson,
                progress: mockLesson?.progress ?? {
                    lessonId: apiLesson.id,
                    courseId,
                    status: index === 0 ? 'current' : 'available',
                    isCompleted: false,
                },
            };
        });
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
            return {
                ...course,
                progress,
            };
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

    private mapCourseDtoToAcademyCourse(course: CourseReadDto): AcademyCourse {
        const id = course.id ?? '';
        const title = course.title ?? 'Untitled course';
        const stageId = this.mapLevelToStage(course.level ?? 'AllLevels');
        const category = this.mapCategory(course.category ?? 'Other');
        const lessons = course.numberOfLessons ?? 0;

        return {
            id,
            stageId,
            title,
            category,
            categoryLabel: this.mapCategoryLabel(category),
            lessons,
            duration: this.buildDurationText(lessons),
            thumbnailUrl: toApiMediaUrl(course.thumbnailUrl ?? null) ?? undefined,
            description: course.description ?? undefined,
        };
    }

    private mapCourseByIdDtoToAcademyCourse(course: CourseReadByIdDto): AcademyCourse {
        const mapped = this.mapCourseDtoToAcademyCourse({
            id: course.id,
            title: course.title,
            category: course.category,
            level: course.level,
            numberOfLessons: course.numberOfLessons,
            thumbnailUrl: course.thumbnailUrl,
            description: course.description,
            instructorID: course.instructorID,
            instructorName: course.instructorName,
            numberOfStudentsEnrolled: course.numberOfStudentsEnrolled,
        });

        const explicitLessonCount = course.lessons?.length;
        if (typeof explicitLessonCount === 'number' && explicitLessonCount > 0) {
            return {
                ...mapped,
                lessons: explicitLessonCount,
                duration: this.buildDurationText(explicitLessonCount),
            };
        }

        return mapped;
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
            order: index + 1,
            description: lesson.content ?? undefined,
        };
    }

    private mapCategory(category: string): AcademyCourse['category'] {
        if (MAIN_BELIEVES_CATEGORIES.has(category)) {
            return 'main-believes';
        }

        if (MODELS_STORIES_CATEGORIES.has(category)) {
            return 'models-stories';
        }

        return 'social-topics';
    }

    private mapCategoryLabel(category: AcademyCourse['category']): string {
        switch (category) {
            case 'main-believes':
                return 'A: Main Believes';
            case 'models-stories':
                return 'B: Models & Stories';
            case 'social-topics':
                return 'C: Social Topics';
            default:
                return CATEGORY_LABELS.unknown;
        }
    }

    private mapLevelToStage(level: string): number {
        return LEVEL_TO_STAGE[level] ?? 1;
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
}

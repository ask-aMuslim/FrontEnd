import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
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
import { ProgressFacade } from '../../api/facades/progress.facade';
import { LessonFacade, LessonReadDto } from '../../api/facades/lesson.facade';
import { CourseFacade, CourseReadDto, CourseReadByIdDto } from '../../api/facades/course.facade';
import { StudentFacade } from '../../api/facades/student.facade';
import { EnrollmentFacade } from '../../api/facades/enrollment.facade';
import { toApiMediaUrl } from '../helpers/media-url.helper';

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
    private readonly studentFacade = inject(StudentFacade);
    private readonly enrollmentFacade = inject(EnrollmentFacade);

    private readonly progressSubject = new BehaviorSubject<StudentProgress | null>(null);
    readonly progress$ = this.progressSubject.asObservable();
    private academyCoursesCache: AcademyCourse[] = [];
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
     * Get complete student progress.
        * Builds progress from API-backed enrollments, courses, and lessons.
     */
    getStudentProgress(): Observable<StudentProgress> {
        return this.getAcademyCourses().pipe(
            switchMap(courses =>
                this.studentFacade.me().pipe(
                    switchMap(student => this.buildProgressForStudent(courses, student?.id)),
                    catchError(() => of(this.buildStudentProgress('anonymous', courses, new Set<string>(), null)))
                )
            ),
            tap(progress => this.progressSubject.next(progress))
        );
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

    getAcademyCourses(forceRefresh = false): Observable<AcademyCourse[]> {
        const useCache = !forceRefresh && this.academyCoursesCache.length > 0;
        if (useCache) {
            return of(this.academyCoursesCache);
        }

        return this.courseFacade.getAllCourses().pipe(
            map(courses => courses.map(course => this.mapCourseDtoToAcademyCourse(course))),
            tap(courses => {
                this.academyCoursesCache = courses;
            }),
            catchError(() => of([]))
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
            }),
            catchError(() =>
                of({
                    id: courseId,
                    stageId: 1,
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
            tap(lessons => {
                this.lessonsCache.set(courseId, lessons);
            }),
            catchError(() => of([]))
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
                map(() => this.buildLessonProgress(request.lessonId, request.courseId, true))
            );
        }

        if (request.watchTime !== undefined || request.lastPosition !== undefined) {
            return this.lessonFacade.saveProgress(request.lessonId, {
                completed: false,
                currentTime: request.lastPosition,
            }).pipe(
                map(() => this.buildLessonProgress(request.lessonId, request.courseId, false))
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
        const unlockedStageIds = new Set<number>(sortedStageIds.filter(stageId => stageId === 1));

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
                isUnlocked: stageId === 1,
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

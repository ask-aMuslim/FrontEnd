import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AcademyMockDataService } from './mock-data/academy-mock-data.service';
import {
    ACADEMY_COURSES,
    getSeedCourse,
    getSeedLessonsByCourse,
    getSeedLesson,
} from './mock-data/academy-seed-data';
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

// Re-export for backward compatibility
export { ACADEMY_STAGES } from './mock-data/academy-seed-data';
export { ACADEMY_COURSES } from './mock-data/academy-seed-data';
export { ACADEMY_LESSONS } from './mock-data/academy-seed-data';
export type { AcademyStage } from './mock-data/academy-seed-data';

/**
 * Academy Progress Service
 *
 * Manages student progress through the academy including:
 * - Stage unlock status (unlocked after passing stage quiz)
 * - Course completion tracking
 * - Lesson progress tracking
 * - Recent lesson for "Continue Learning" feature
 *
 * API Integration Notes:
 * - GET /api/progress - Get complete student progress
 * - PUT /api/progress/lesson/:lessonId - Update lesson progress
 * - POST /api/progress/quiz - Submit quiz result and unlock next stage
 *
 * Current implementation uses the AcademyMockDataService for development.
 * When API is ready, replace mock service calls with actual API calls.
 */
@Injectable({
    providedIn: 'root',
})
export class AcademyProgressService {
    // BehaviorSubject to track progress changes across components
    private readonly progressSubject = new BehaviorSubject<StudentProgress | null>(null);
    public progress$ = this.progressSubject.asObservable();

    constructor(
        private readonly api: ApiService,
        private readonly mockDataService: AcademyMockDataService
    ) {
        // Initialize with mock data
        this.mockDataService.getStudentProgress().subscribe(progress => {
            this.progressSubject.next(progress);
        });
    }

    /**
     * Get complete student progress
     * NOTE: Replace with API call: GET /api/progress when backend is ready
     */
    getStudentProgress(): Observable<StudentProgress> {
        // NOTE: Uncomment when API is ready
        // return this.api.get<StudentProgress>(API_ENDPOINTS.progress.get());
        return this.mockDataService.getStudentProgress();
    }

    /**
     * Get recent lesson for "Continue Learning" button
    * NOTE: Will be part of GET /api/progress response
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
            map((progress) => {
                const stageCourses = ACADEMY_COURSES.filter((c) => c.stageId === stageNumber);
                return stageCourses.map((course) => ({
                    ...course,
                    progress: progress.courseProgress.find((cp) => cp.courseId === course.id) || {
                        courseId: course.id,
                        status: 'locked' as CourseStatus,
                        progress: 0,
                        completedLessons: 0,
                        totalLessons: course.lessons,
                        quizPassed: false,
                    },
                }));
            })
        );
    }

    /**
     * Get lessons for a specific course with their progress
     */
    getCourseLessonsWithProgress(courseId: string): Observable<(AcademyLesson & { progress: LessonProgress })[]> {
        return this.mockDataService.getCourseLessonsWithProgress(courseId);
    }

    /**
     * Update lesson progress
     * NOTE: Replace with API call: PUT /api/progress/lesson/:lessonId when backend is ready
     */
    updateLessonProgress(request: UpdateLessonProgressRequest): Observable<LessonProgress> {
        // NOTE: Uncomment when API is ready
        // return this.api.put<LessonProgress>(
        //   API_ENDPOINTS.progress.updateLesson(request.lessonId),
        //   request
        // );

        if (request.isCompleted) {
            return this.mockDataService.markLessonCompleted(request.lessonId, request.courseId);
        }

        if (request.watchTime !== undefined || request.lastPosition !== undefined) {
            return this.mockDataService.updateLessonWatchProgress(
                request.lessonId,
                request.courseId,
                request.watchTime || 0,
                request.lastPosition || 0
            );
        }

        // Return empty progress if nothing to update
        return this.mockDataService.getCourseLessonsWithProgress(request.courseId).pipe(
            map(lessons => {
                const lesson = lessons.find(l => l.id === request.lessonId);
                return lesson?.progress || {
                    lessonId: request.lessonId,
                    courseId: request.courseId,
                    status: 'locked' as LessonStatus,
                    isCompleted: false,
                };
            })
        );
    }

    /**
     * Mark lesson as completed
     */
    markLessonCompleted(lessonId: string, courseId: string): Observable<LessonProgress> {
        return this.updateLessonProgress({
            lessonId,
            courseId,
            isCompleted: true,
        });
    }

    /**
     * Submit quiz result and potentially unlock next stage
     * NOTE: Replace with API call: POST /api/progress/quiz when backend is ready
     */
    submitQuizResult(request: SubmitQuizResultRequest): Observable<StageQuizResult> {
        // NOTE: Uncomment when API is ready
        // return this.api.post<StageQuizResult>(API_ENDPOINTS.progress.submitQuiz(), request);

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
        return getSeedCourse(courseId);
    }

    /**
     * Get static lesson data by ID
     */
    getLessonById(lessonId: string): AcademyLesson | undefined {
        return getSeedLesson(lessonId);
    }

    /**
     * Get lessons for a course
     */
    getCourseLessons(courseId: string): AcademyLesson[] {
        return getSeedLessonsByCourse(courseId)
            .sort((a, b) => a.order - b.order);
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
}

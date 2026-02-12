/**
 * Academy Mock Data Service
 *
 * Provides mock/seed data for all academy pages through observable streams.
 * This service simulates API responses for development and testing.
 *
 * When the real API is ready, this service can be replaced by actual API calls
 * or used as a fallback when the API is unavailable.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    ACADEMY_STAGES,
    ACADEMY_COURSES,
    SEED_STUDENT_PROGRESS,
    getSeedCourse,
    getSeedCoursesByStage,
    getSeedLessonsByCourse,
    getSeedLesson,
    getSeedQuizQuestions,
    getSeedStage,
    AcademyStage,
    SeedCourse,
    SeedLesson,
    SeedQuizQuestion,
    SeedStudentProgress,
    SeedLessonNote,
} from './academy-seed-data';
import { LessonType } from '../../models/interfaces/enums.model';
import {
    StudentProgress,
    StageProgress,
    CourseProgress,
    LessonProgress,
    RecentLessonInfo,
    LessonStatus,
} from '../../models/interfaces/academy-progress.model';
import {
    LessonContent,
    LessonData,
    LessonMetadata,
    VideoLessonContent,
    AudioLessonContent,
    ArticleLessonContent,
    IntroLessonContent,
} from '../../models/interfaces/lesson-content.model';
import { QuizDto } from '../../models/interfaces/quiz.model';

/**
 * Configuration for mock service behavior
 */
interface MockServiceConfig {
    simulateDelay: boolean;
    delayMs: number;
    simulateErrors: boolean;
    errorRate: number; // 0-1
}

@Injectable({
    providedIn: 'root',
})
export class AcademyMockDataService {
    private readonly config: MockServiceConfig = {
        simulateDelay: true,
        delayMs: 300,
        simulateErrors: false,
        errorRate: 0.1,
    };

    // Mutable progress state for tracking updates during session
    private readonly progressState = new BehaviorSubject<SeedStudentProgress>(
        { ...SEED_STUDENT_PROGRESS }
    );

    constructor() {
        // Initialize with seed data
        this.resetProgress();
    }

    // ============================================================================
    // CONFIGURATION
    // ============================================================================

    /**
     * Configure mock service behavior
     */
    configure(config: Partial<MockServiceConfig>): void {
        Object.assign(this.config, config);
    }

    /**
     * Reset progress to initial seed state
     */
    resetProgress(): void {
        this.progressState.next({ ...SEED_STUDENT_PROGRESS });
    }

    // ============================================================================
    // STAGE DATA
    // ============================================================================

    /**
     * Get all stages
     */
    getStages(): Observable<AcademyStage[]> {
        return this.wrapWithDelay(of([...ACADEMY_STAGES]));
    }

    /**
     * Get a specific stage by number
     */
    getStage(stageNumber: number): Observable<AcademyStage | undefined> {
        return this.wrapWithDelay(of(getSeedStage(stageNumber)));
    }

    // ============================================================================
    // COURSE DATA
    // ============================================================================

    /**
     * Get all courses
     */
    getCourses(): Observable<SeedCourse[]> {
        return this.wrapWithDelay(of([...ACADEMY_COURSES]));
    }

    /**
     * Get a specific course by ID
     */
    getCourse(courseId: string): Observable<SeedCourse | undefined> {
        return this.wrapWithDelay(of(getSeedCourse(courseId)));
    }

    /**
     * Get courses by stage
     */
    getCoursesByStage(stageId: number): Observable<SeedCourse[]> {
        return this.wrapWithDelay(of(getSeedCoursesByStage(stageId)));
    }

    /**
     * Get courses grouped by category for a stage
     */
    getCoursesByStageGrouped(stageId: number): Observable<{
        mainBelieves: SeedCourse[];
        modelsStories: SeedCourse[];
        socialTopics: SeedCourse[];
    }> {
        const stageCourses = getSeedCoursesByStage(stageId);
        return this.wrapWithDelay(
            of({
                mainBelieves: stageCourses.filter(c => c.category === 'main-believes'),
                modelsStories: stageCourses.filter(c => c.category === 'models-stories'),
                socialTopics: stageCourses.filter(c => c.category === 'social-topics'),
            })
        );
    }

    // ============================================================================
    // LESSON DATA
    // ============================================================================

    /**
     * Get all lessons for a course
     */
    getLessonsByCourse(courseId: string): Observable<SeedLesson[]> {
        return this.wrapWithDelay(of(getSeedLessonsByCourse(courseId)));
    }

    /**
     * Get a specific lesson by ID
     */
    getLesson(lessonId: string): Observable<SeedLesson | undefined> {
        return this.wrapWithDelay(of(getSeedLesson(lessonId)));
    }

    /**
     * Get lesson content formatted for the lesson player
     */
    getLessonContent(lessonId: string): Observable<LessonContent | undefined> {
        const lesson = getSeedLesson(lessonId);
        if (!lesson) {
            return this.wrapWithDelay(of(undefined));
        }

        const content = this.mapSeedLessonToContent(lesson);
        return this.wrapWithDelay(of(content));
    }

    /**
     * Get full lesson data including navigation info
     */
    getLessonData(lessonId: string, courseId: string): Observable<LessonData | undefined> {
        const lesson = getSeedLesson(lessonId);
        if (!lesson) {
            return this.wrapWithDelay(of(undefined));
        }

        const courseLessons = getSeedLessonsByCourse(courseId);
        const currentIndex = courseLessons.findIndex(l => l.id === lessonId);

        const lessonData: LessonData = {
            content: this.mapSeedLessonToContent(lesson),
            metadata: this.mapSeedLessonToMetadata(lesson),
            nextLesson:
                currentIndex < courseLessons.length - 1
                    ? this.mapSeedLessonToMetadata(courseLessons[currentIndex + 1])
                    : undefined,
            previousLesson:
                currentIndex > 0
                    ? this.mapSeedLessonToMetadata(courseLessons[currentIndex - 1])
                    : undefined,
        };

        return this.wrapWithDelay(of(lessonData));
    }

    /**
     * Get lesson metadata list for course sidebar
     */
    getCourseLessonsMetadata(courseId: string): Observable<LessonMetadata[]> {
        const lessons = getSeedLessonsByCourse(courseId);
        const progress = this.progressState.getValue();

        const metadata = lessons.map(lesson => {
            const lessonProgress = progress.lessonProgress.find(p => p.lessonId === lesson.id);
            return {
                ...this.mapSeedLessonToMetadata(lesson),
                status: lessonProgress?.status || ('locked' as LessonStatus),
            } as LessonMetadata;
        });

        return this.wrapWithDelay(of(metadata));
    }

    // ============================================================================
    // QUIZ DATA
    // ============================================================================

    /**
     * Get quiz for a course
     */
    getQuizByCourse(courseId: string): Observable<QuizDto | undefined> {
        const quiz: QuizDto = {
            id: `quiz-${courseId}`,
            courseId,
            title: `Quiz for ${getSeedCourse(courseId)?.title || 'Course'}`,
            totalMarks: 10,
            questionsCount: 10,
        };
        return this.wrapWithDelay(of(quiz));
    }

    /**
     * Get quiz questions
     */
    getQuizQuestions(courseId: string): Observable<SeedQuizQuestion[]> {
        return this.wrapWithDelay(of(getSeedQuizQuestions(courseId)));
    }

    /**
     * Get quiz questions formatted for the quiz component
     */
    getQuizQuestionsFormatted(courseId: string): Observable<
        Array<{
            id: string;
            questionNumber: number;
            questionText: string;
            options: Array<{ id: string; label: string; text: string }>;
            correctOptionId: string;
            hint?: string;
            evidenceSource?: string;
        }>
    > {
        const questions = getSeedQuizQuestions(courseId);
        return this.wrapWithDelay(of(questions));
    }

    // ============================================================================
    // PROGRESS DATA
    // ============================================================================

    /**
     * Get complete student progress
     */
    getStudentProgress(): Observable<StudentProgress> {
        return this.progressState.asObservable().pipe(
            map(progress => ({
                studentId: progress.studentId,
                currentStage: progress.currentStage,
                recentLesson: progress.recentLesson,
                stageProgress: progress.stageProgress,
                courseProgress: progress.courseProgress,
                lessonProgress: progress.lessonProgress,
            }))
        );
    }

    /**
     * Get stage progress
     */
    getStageProgress(): Observable<StageProgress[]> {
        return this.progressState.pipe(map(p => p.stageProgress));
    }

    /**
     * Get course progress
     */
    getCourseProgress(courseId: string): Observable<CourseProgress | undefined> {
        return this.progressState.pipe(
            map(p => p.courseProgress.find(cp => cp.courseId === courseId))
        );
    }

    /**
     * Get lessons with progress for a course
     */
    getCourseLessonsWithProgress(
        courseId: string
    ): Observable<(SeedLesson & { progress: LessonProgress })[]> {
        const lessons = getSeedLessonsByCourse(courseId);

        return this.progressState.pipe(
            map(progress =>
                lessons.map(lesson => ({
                    ...lesson,
                    progress: progress.lessonProgress.find(p => p.lessonId === lesson.id) || {
                        lessonId: lesson.id,
                        courseId,
                        status: 'locked' as LessonStatus,
                        isCompleted: false,
                    },
                }))
            )
        );
    }

    /**
     * Get recent lesson info
     */
    getRecentLesson(): Observable<RecentLessonInfo | null> {
        return this.progressState.pipe(map(p => p.recentLesson));
    }

    // ============================================================================
    // PROGRESS UPDATES
    // ============================================================================

    /**
     * Mark a lesson as completed
     */
    markLessonCompleted(lessonId: string, courseId: string): Observable<LessonProgress> {
        const progress = { ...this.progressState.getValue() };

        const lessonProgress = progress.lessonProgress.find(p => p.lessonId === lessonId);
        if (lessonProgress) {
            lessonProgress.status = 'completed';
            lessonProgress.isCompleted = true;
            lessonProgress.completedAt = new Date().toISOString();

            // Unlock next lesson
            this.unlockNextLesson(progress, courseId, lessonId);

            // Update course progress
            this.updateCourseProgress(progress, courseId);

            // Update recent lesson
            this.updateRecentLesson(progress, lessonId, courseId);

            this.progressState.next(progress);
        }

        return this.wrapWithDelay(of(lessonProgress!));
    }

    /**
     * Update lesson watch progress
     */
    updateLessonWatchProgress(
        lessonId: string,
        courseId: string,
        watchTime: number,
        lastPosition: number
    ): Observable<LessonProgress> {
        const progress = { ...this.progressState.getValue() };

        const lessonProgress = progress.lessonProgress.find(p => p.lessonId === lessonId);
        if (lessonProgress) {
            lessonProgress.watchTime = watchTime;
            lessonProgress.lastPosition = lastPosition;

            if (lessonProgress.status === 'available') {
                lessonProgress.status = 'current';
            }

            this.updateRecentLesson(progress, lessonId, courseId);
            this.progressState.next(progress);
        }

        return this.wrapWithDelay(of(lessonProgress!));
    }

    /**
     * Submit quiz result
     */
    submitQuizResult(
        courseId: string,
        score: number,
        passed: boolean
    ): Observable<{
        courseId: string;
        score: number;
        passed: boolean;
        nextCourseUnlocked: boolean;
    }> {
        const progress = { ...this.progressState.getValue() };

        const courseProgress = progress.courseProgress.find(p => p.courseId === courseId);
        if (courseProgress) {
            courseProgress.quizScore = score;
            courseProgress.quizPassed = passed;

            if (passed) {
                courseProgress.status = 'completed';
                courseProgress.progress = 100;

                // Mark quiz lesson as completed
                const quizLesson = getSeedLessonsByCourse(courseId).find(l => l.type === 'quiz');
                if (quizLesson) {
                    const quizProgress = progress.lessonProgress.find(
                        p => p.lessonId === quizLesson.id
                    );
                    if (quizProgress) {
                        quizProgress.status = 'completed';
                        quizProgress.isCompleted = true;
                    }
                }

                // Unlock next course in stage
                this.unlockNextCourse(progress, courseId);
            }

            this.progressState.next(progress);
        }

        return this.wrapWithDelay(
            of({
                courseId,
                score,
                passed,
                nextCourseUnlocked: passed,
            })
        );
    }

    // ============================================================================
    // NOTES
    // ============================================================================

    /**
     * Get notes for a lesson
     */
    getLessonNotes(lessonId: string): Observable<SeedLessonNote[]> {
        const progress = this.progressState.getValue();
        const notes = progress.notes.filter(n => n.lessonId === lessonId);
        return this.wrapWithDelay(of(notes));
    }

    /**
     * Add a note to a lesson
     */
    addLessonNote(
        lessonId: string,
        text: string,
        timestamp: string
    ): Observable<SeedLessonNote> {
        const progress = { ...this.progressState.getValue() };
        const newNote: SeedLessonNote = {
            id: `note-${Date.now()}`,
            lessonId,
            timestamp,
            text,
            createdAt: new Date().toISOString(),
        };

        progress.notes = [...progress.notes, newNote];
        this.progressState.next(progress);

        return this.wrapWithDelay(of(newNote));
    }

    /**
     * Delete a note
     */
    deleteLessonNote(noteId: string): Observable<boolean> {
        const progress = { ...this.progressState.getValue() };
        progress.notes = progress.notes.filter(n => n.id !== noteId);
        this.progressState.next(progress);

        return this.wrapWithDelay(of(true));
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private wrapWithDelay<T>(observable: Observable<T>): Observable<T> {
        if (this.config.simulateDelay) {
            return observable.pipe(delay(this.config.delayMs));
        }
        return observable;
    }

    private mapSeedLessonToContent(lesson: SeedLesson): LessonContent {
        const baseId = lesson.id;

        switch (lesson.content.type) {
            case 'intro':
                return {
                    id: baseId,
                    type: 'intro',
                    title: lesson.title,
                    description: lesson.description || '',
                    courseOverview: lesson.content.courseOverview,
                    objectives: lesson.content.objectives,
                    duration: lesson.duration,
                } as IntroLessonContent;

            case 'video':
                return {
                    id: baseId,
                    type: LessonType.Video,
                    title: lesson.title,
                    description: lesson.description || '',
                    videoUrl: lesson.content.videoUrl,
                    thumbnailUrl: lesson.content.thumbnailUrl,
                    duration: lesson.duration,
                    transcript: lesson.content.transcript,
                } as VideoLessonContent;

            case 'audio':
                return {
                    id: baseId,
                    type: LessonType.Audio,
                    title: lesson.title,
                    description: lesson.description || '',
                    audioUrl: lesson.content.audioUrl,
                    duration: lesson.duration,
                    transcript: lesson.content.transcript,
                    language: lesson.content.language,
                    subtitles: lesson.content.subtitles,
                } as AudioLessonContent;

            case 'article':
                return {
                    id: baseId,
                    type: LessonType.Article,
                    title: lesson.title,
                    description: lesson.description || '',
                    sections: lesson.content.sections,
                } as ArticleLessonContent;

            case 'quiz':
                // Quiz content is handled separately
                return {
                    id: baseId,
                    type: LessonType.Article,
                    title: lesson.title,
                    description: lesson.content.description,
                    sections: [
                        {
                            header: 'Quiz Instructions',
                            content: `This quiz has ${lesson.content.totalQuestions} questions. You need to score at least ${lesson.content.passingScore} to pass. Time limit: ${lesson.content.timeLimit} minutes.`,
                        },
                    ],
                } as ArticleLessonContent;

            default:
                return {
                    id: baseId,
                    type: LessonType.Article,
                    title: lesson.title,
                    description: lesson.description || '',
                    sections: [],
                } as ArticleLessonContent;
        }
    }

    private mapSeedLessonToMetadata(lesson: SeedLesson): LessonMetadata {
        let lessonType: LessonType;

        switch (lesson.type) {
            case 'intro':
                lessonType = LessonType.Article; // Intro is treated as article type
                break;
            case 'video':
                lessonType = LessonType.Video;
                break;
            case 'article':
                lessonType = LessonType.Article;
                break;
            case 'quiz':
                lessonType = LessonType.Document; // Quiz uses document type
                break;
            case 'audio':
                lessonType = LessonType.Audio;
                break;
            default:
                lessonType = LessonType.Article;
        }

        return {
            id: lesson.id,
            courseId: lesson.courseId,
            title: lesson.title,
            type: lessonType,
            status: 'pending',
            duration: lesson.duration,
            order: lesson.order,
        };
    }

    private unlockNextLesson(
        progress: SeedStudentProgress,
        courseId: string,
        currentLessonId: string
    ): void {
        const lessons = getSeedLessonsByCourse(courseId);
        const currentIndex = lessons.findIndex(l => l.id === currentLessonId);

        if (currentIndex < lessons.length - 1) {
            const nextLesson = lessons[currentIndex + 1];
            const nextLessonProgress = progress.lessonProgress.find(
                p => p.lessonId === nextLesson.id
            );

            if (nextLessonProgress?.status === 'locked') {
                nextLessonProgress.status = 'available';
            }
        }
    }

    private updateCourseProgress(progress: SeedStudentProgress, courseId: string): void {
        const courseProgress = progress.courseProgress.find(p => p.courseId === courseId);
        if (!courseProgress) return;

        const courseLessonProgress = progress.lessonProgress.filter(
            p => p.courseId === courseId
        );
        const completedLessons = courseLessonProgress.filter(p => p.isCompleted).length;
        const totalLessons = courseLessonProgress.length;

        courseProgress.completedLessons = completedLessons;
        courseProgress.progress = Math.round((completedLessons / totalLessons) * 100);

        if (courseProgress.progress > 0 && courseProgress.status === 'available') {
            courseProgress.status = 'in-progress';
        }
    }

    private updateRecentLesson(
        progress: SeedStudentProgress,
        lessonId: string,
        courseId: string
    ): void {
        const lesson = getSeedLesson(lessonId);
        const course = getSeedCourse(courseId);

        if (lesson && course) {
            const courseProgress = progress.courseProgress.find(p => p.courseId === courseId);

            progress.recentLesson = {
                stageNumber: course.stageId,
                courseId: course.id,
                courseName: course.title,
                lessonId: lesson.id,
                lessonNumber: lesson.order,
                lessonTitle: lesson.title,
                thumbnailUrl: `/academy/lessons/${lesson.id}.jpg`,
                progress: 0,
                currentTime: '00:00',
                totalTime: lesson.duration,
                completedLessons: courseProgress?.completedLessons || 0,
                totalLessons: course.lessons,
            };
        }
    }

    private unlockNextCourse(progress: SeedStudentProgress, currentCourseId: string): void {
        const course = getSeedCourse(currentCourseId);
        if (!course) return;

        const stageCourses = getSeedCoursesByStage(course.stageId);
        const currentIndex = stageCourses.findIndex(c => c.id === currentCourseId);

        // Unlock next course in same stage
        if (currentIndex < stageCourses.length - 1) {
            const nextCourse = stageCourses[currentIndex + 1];
            const nextCourseProgress = progress.courseProgress.find(
                p => p.courseId === nextCourse.id
            );

            if (nextCourseProgress?.status === 'locked') {
                nextCourseProgress.status = 'available';

                // Unlock first lesson of next course
                const firstLesson = getSeedLessonsByCourse(nextCourse.id)[0];
                if (firstLesson) {
                    const firstLessonProgress = progress.lessonProgress.find(
                        p => p.lessonId === firstLesson.id
                    );
                    if (firstLessonProgress) {
                        firstLessonProgress.status = 'available';
                    }
                }
            }
        } else {
            // Check if all stage courses are completed to unlock next stage
            this.handleStageCompletion(progress, course.stageId, stageCourses);
        }
    }

    /**
     * Handles unlocking next stage when all courses in current stage are completed
     */
    private handleStageCompletion(
        progress: SeedStudentProgress,
        currentStageId: number,
        stageCourses: SeedCourse[]
    ): void {
        const allStageCoursesCompleted = stageCourses.every(c => {
            const cp = progress.courseProgress.find(p => p.courseId === c.id);
            return cp?.status === 'completed';
        });

        if (!allStageCoursesCompleted) return;

        // Unlock next stage
        const nextStageProgress = progress.stageProgress.find(
            s => s.stageNumber === currentStageId + 1
        );
        if (!nextStageProgress) return;

        nextStageProgress.isUnlocked = true;

        // Unlock first course of next stage
        const nextStageCourses = getSeedCoursesByStage(currentStageId + 1);
        if (nextStageCourses.length === 0) return;

        const firstCourse = nextStageCourses[0];
        const firstCourseProgress = progress.courseProgress.find(
            p => p.courseId === firstCourse.id
        );
        if (!firstCourseProgress) return;

        firstCourseProgress.status = 'available';

        // Unlock first lesson
        const firstLesson = getSeedLessonsByCourse(firstCourse.id)[0];
        if (!firstLesson) return;

        const firstLessonProgress = progress.lessonProgress.find(
            p => p.lessonId === firstLesson.id
        );
        if (firstLessonProgress) {
            firstLessonProgress.status = 'available';
        }
    }
}

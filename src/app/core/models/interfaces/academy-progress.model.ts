import { Id } from './base.model';

/**
 * Academy Progress Models
 * API-ready interfaces for tracking student progress through the academy
 *
 * Future API Endpoint: GET /api/progress
 * Will return StudentProgress with current lesson and stage completion status
 */

/**
 * Course status in the academy
 */
export type CourseStatus = 'completed' | 'in-progress' | 'locked' | 'available';

/**
 * Lesson status within a course
 */
export type LessonStatus = 'completed' | 'current' | 'locked' | 'available';

/**
 * Lesson type for categorization
 */
export type AcademyLessonType = 'intro' | 'video' | 'article' | 'document' | 'quiz' | 'audio';

/**
 * Course category within a stage
 */
export type CourseCategory = 'main-believes' | 'models-stories' | 'social-topics';

/**
 * Academy Stage from API (mapped from Level entity)
 */
export interface AcademyStageApi {
    id: string;       // actual level UUID from API
    number: number;   // 1-based index (order)
    title: string;
    description: string;
    order: number;
    difficulty: number;
}

/**
 * Academy Course Definition
 */
export interface AcademyCourse {
    id: Id;
    stageId: number;
    levelId?: string;  // actual level UUID from API
    title: string;
    isPublished?: boolean;
    category: CourseCategory;
    categoryLabel: string;
    lessons: number;
    duration: string;
    thumbnailUrl?: string;
    description?: string;
    order?: number;
    prerequisites?: Id[];
}

/**
 * Academy Lesson Definition
 */
export interface AcademyLesson {
    id: Id;
    courseId: Id;
    title: string;
    isPublished?: boolean;
    duration: string;
    videoUrl?: string;
    audioUrl?: string;
    type: AcademyLessonType;
    order: number;
    description?: string;
}

/**
 * Student's progress on a specific course
 */
export interface CourseProgress {
    courseId: Id;
    status: CourseStatus;
    progress: number; // 0-100 percentage
    completedLessons: number;
    totalLessons: number;
    lastAccessedLessonId?: Id;
    quizPassed: boolean;
    quizScore?: number;
}

/**
 * Student's progress on a specific lesson
 */
export interface LessonProgress {
    lessonId: Id;
    courseId: Id;
    status: LessonStatus;
    isCompleted: boolean;
    completedAt?: string;
    watchTime?: number; // seconds watched for video/audio
    lastPosition?: number; // last playback position
}

/**
 * Stage completion status
 */
export interface StageProgress {
    stageNumber: number;
    isUnlocked: boolean;
    quizPassed: boolean;
    quizScore?: number;
    completedCourses: number;
    totalCourses: number;
}

/**
 * Recent lesson information for "Continue Learning" feature
 */
export interface RecentLessonInfo {
    stageNumber: number;
    courseId: Id;
    courseName: string;
    lessonId: Id;
    lessonType?: AcademyLessonType;
    lessonNumber: number;
    lessonTitle: string;
    thumbnailUrl: string;
    progress: number; // 0-100 percentage watched
    currentTime: string;
    totalTime: string;
    completedLessons: number;
    totalLessons: number;
}

/**
 * Complete student progress response
 * Future API: GET /api/progress
 */
export interface StudentProgress {
    studentId: Id;
    currentStage: number;
    recentLesson: RecentLessonInfo | null;
    stageProgress: StageProgress[];
    courseProgress: CourseProgress[];
    lessonProgress: LessonProgress[];
}

/**
 * Request to update lesson progress
 * Future API: PUT /api/progress/lesson/:lessonId
 */
export interface UpdateLessonProgressRequest {
    lessonId: Id;
    courseId: Id;
    lessonType?: AcademyLessonType;
    progressPercentage?: number;
    markAsRead?: boolean;
}

/**
 * Request to submit quiz result
 * Future API: POST /api/progress/quiz
 */
export interface SubmitQuizResultRequest {
    stageNumber: number;
    courseId: Id;
    score: number;
    passed: boolean;
}

/**
 * Stage Quiz Result - used for unlocking next stage
 */
export interface StageQuizResult {
    stageNumber: number;
    score: number;
    passed: boolean;
    nextStageUnlocked: boolean;
}

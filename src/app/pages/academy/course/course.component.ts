import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import {
    AcademyPageShellComponent,
    AcademyBreadcrumbItem,
} from '../shared/academy-page-shell/academy-page-shell.component';
import {
    AcademyCourse,
    AcademyLesson,
    CourseProgress,
    LessonProgress,
} from '../../../core/models/interfaces/academy-progress.model';

/**
 * Lesson interface for template binding
 */
interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: 'intro' | 'video' | 'article' | 'quiz' | 'audio';
    isLocked: boolean;
    isCompleted: boolean;
    isCurrent: boolean;
    hasNotification?: boolean;
}

/**
 * Course details interface for template binding
 */
interface CourseDetails {
    id: string;
    stageNumber: number;
    title: string;
    intro: string;
    lessons: string[];
    answers: string[];
    totalLessons: number;
    completedLessons: number;
    duration: string;
    isLocked: boolean;
    lessonsList: Lesson[];
}

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [RouterLink, AcademyPageShellComponent],
    templateUrl: './course.component.html',
    styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private courseId: string = '';

    // Course data loaded from service
    course: CourseDetails | null = null;

    // Loading and error states
    isLoading = true;
    error: string | null = null;

    backgroundImageUrl =
        '/backgrounds/course-background.png'; // Default background image for all courses (can be customized per course if needed)

    readonly breadcrumbs: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly academyProgressService: AcademyProgressService,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        // Get course ID from route params using snapshot for SSR compatibility
        this.courseId = this.route.snapshot.paramMap.get('id') || '';
        if (this.courseId) {
            this.loadCourseData();
        } else {
            this.error = 'No course ID provided';
            this.isLoading = false;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load course data and lessons with progress.
     * Uses API-backed course and lesson content and merges student progress.
     */
    private loadCourseData(): void {
        this.error = null;
        this.isLoading = true;

        combineLatest([
            this.academyProgressService.getAcademyCourseById(this.courseId),
            this.academyProgressService.getCourseProgress(this.courseId),
            this.academyProgressService.getCourseLessonsWithProgress(this.courseId)
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([courseData, courseProgress, lessonsWithProgress]) => {
                    this.course = this.buildCourseDetails(
                        courseData,
                        courseProgress,
                        lessonsWithProgress
                    );
                    this.error = null;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.error = 'Unable to load this course right now. Please try again.';
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
            });
    }

    /**
     * Build CourseDetails from service data
     */
    private buildCourseDetails(
        courseData: AcademyCourse,
        courseProgress: CourseProgress | undefined,
        lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[]
    ): CourseDetails {
        const isLocked = courseProgress?.status === 'locked';

        return {
            id: courseData.id,
            stageNumber: courseData.stageId,
            title: `Course: ${courseData.title}`,
            intro:
                courseData.description ||
                "In this course, you'll learn comprehensive content designed to guide you step by step through important Islamic teachings.",
            lessons: lessonsWithProgress
                .filter((l) => l.type !== 'quiz' && l.type !== 'intro')
                .map((l) => l.title),
            answers: ['Why God..?', 'Is Mohamed..?'], // NOTE: Load from API when available
            totalLessons: lessonsWithProgress.length,
            completedLessons: lessonsWithProgress.filter((l) => l.progress.isCompleted).length,
            duration: courseData.duration,
            isLocked,
            lessonsList: lessonsWithProgress.map((lesson) =>
                this.mapLessonForDisplay(lesson, isLocked)
            ),
        };
    }

    /**
     * Map lesson data for display
     */
    private mapLessonForDisplay(
        lesson: AcademyLesson & { progress: LessonProgress },
        courseLocked: boolean
    ): Lesson {
        const isLocked = courseLocked || lesson.progress.status === 'locked';
        const isCompleted = lesson.progress.isCompleted;
        const isCurrent = lesson.progress.status === 'current';

        return {
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            type: lesson.type,
            isLocked,
            isCompleted,
            isCurrent,
            hasNotification: isCurrent,
        };
    }

    /**
     * Navigate to first lesson (Begin button)
     */
    onBeginClick(): void {
        if (!this.course || this.course.isLocked) {
            return;
        }

        const firstLesson = this.course.lessonsList.find((lesson) => !lesson.isLocked);
        if (firstLesson) {
            this.router.navigate(['lesson', firstLesson.id], { relativeTo: this.route });
        }
    }

    /**
     * Navigate to quiz lesson (Take Quiz button)
     */
    onTakeQuizClick(): void {
        if (this.course && !this.course.isLocked) {
            // Updated path from academy routes
            this.router.navigate(['quiz'], { relativeTo: this.route });
        }
    }

    /**
     * Navigate to specific lesson
     */
    onLessonClick(lesson: Lesson): void {
        if (!lesson.isLocked) {
            if (lesson.type === 'quiz') {
                // Updated path from academy routes
                this.router.navigate(['quiz'], { relativeTo: this.route });
            } else {
                // Updated path from academy routes
                this.router.navigate(['lesson', lesson.id], { relativeTo: this.route });
            }
        }
    }
}

import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import {
    AcademyPageShellComponent,
    AcademyBreadcrumbItem,
} from '../shared/academy-page-shell/academy-page-shell.component';
import {
    AcademyCourseSidebarComponent,
    AcademySidebarLessonItem,
} from '../shared/academy-course-sidebar/academy-course-sidebar.component';
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
    hasUnmetPrerequisites: boolean;
    unmetPrerequisiteNames: string[];
    lessonsList: Lesson[];
    prerequisitesList: { id: string; title: string; isCompleted: boolean }[];
}

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [RouterLink, AcademyPageShellComponent, AcademyCourseSidebarComponent],
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
    showSignInPrompt = false;

    backgroundImageUrl =
        '/backgrounds/course-background.png'; // Default background image for all courses (can be customized per course if needed)

    get hasPlayableLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => !lesson.isLocked && lesson.type !== 'quiz',
        );
    }

    get hasQuizLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => !lesson.isLocked && lesson.type === 'quiz',
        );
    }

    private getUnlockedQuizLessonId(): string | null {
        const quizLesson = this.course?.lessonsList.find(
            (lesson) => !lesson.isLocked && lesson.type === 'quiz',
        );

        return quizLesson?.id ?? null;
    }

    get isUserAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    readonly breadcrumbs: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly academyProgressService: AcademyProgressService,
        private readonly authService: AuthService,
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
            this.academyProgressService.getCourseLessonsWithProgress(this.courseId),
            this.academyProgressService.getAcademyCourses(),
            this.academyProgressService.getStudentProgress()
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([courseData, courseProgress, lessonsWithProgress, allCourses, studentProgress]) => {
                    this.course = this.buildCourseDetails(
                        courseData,
                        courseProgress,
                        lessonsWithProgress,
                        allCourses,
                        studentProgress.courseProgress
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
        lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[],
        allCourses: AcademyCourse[],
        allCourseProgress: CourseProgress[]
    ): CourseDetails {
        const isLocked = this.isUserAuthenticated
            ? courseProgress?.status === 'locked'
            : false;

        // Calculate unmet prerequisites - enrich with data from allCourses if API response is thin
        const fullCourseFromList = allCourses.find(c => c.id === courseData.id);
        const effectivePrereqIds = (courseData.prerequisites && courseData.prerequisites.length > 0)
            ? courseData.prerequisites
            : (fullCourseFromList?.prerequisites ?? []);

        const unmetPrerequisiteIds = effectivePrereqIds.filter(prereqId => {
            if (prereqId === courseData.id) return false;
            const progress = allCourseProgress.find(cp => cp.courseId === prereqId);
            return progress?.status !== 'completed';
        });

        const unmetPrerequisiteNames = unmetPrerequisiteIds
            .map(id => allCourses.find(c => c.id === id)?.title)
            .filter((name): name is string => !!name);

        const hasUnmetPrerequisites = unmetPrerequisiteNames.length > 0;

        const prerequisitesList = effectivePrereqIds
            .filter(prereqId => prereqId !== courseData.id)
            .map(id => {
                const title = allCourses.find(c => c.id === id)?.title || 'Unknown Course';
                const progress = allCourseProgress.find(cp => cp.courseId === id);
                return {
                    id,
                    title,
                    isCompleted: progress?.status === 'completed'
                };
            });

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
            answers: this.extractOutcomes(courseData.description),
            totalLessons: lessonsWithProgress.length,
            completedLessons: lessonsWithProgress.filter((l) => l.progress.isCompleted).length,
            duration: courseData.duration,
            isLocked,
            hasUnmetPrerequisites,
            unmetPrerequisiteNames,
            lessonsList: lessonsWithProgress.map((lesson) =>
                this.mapLessonForDisplay(lesson, isLocked || hasUnmetPrerequisites)
            ),
            prerequisitesList,
        };
    }

    private extractOutcomes(description: string | undefined): string[] {
        if (!description) {
            return [];
        }

        return description
            .split(/[\n•]+/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .slice(0, 3);
    }

    /**
     * Map lesson data for display
     */
    private mapLessonForDisplay(
        lesson: AcademyLesson & { progress: LessonProgress },
        courseLocked: boolean
    ): Lesson {
        if (!this.isUserAuthenticated) {
            return {
                id: lesson.id,
                title: lesson.title,
                duration: lesson.duration,
                type: lesson.type,
                isLocked: false,
                isCompleted: false,
                isCurrent: false,
                hasNotification: false,
            };
        }

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
        if (!this.authService.isAuthenticated()) {
            this.showSignInPrompt = true;
            return;
        }

        if (!this.course || this.course.isLocked || this.course.hasUnmetPrerequisites) {
            return;
        }

        if (!this.hasPlayableLesson) {
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
        if (!this.authService.isAuthenticated()) {
            this.showSignInPrompt = true;
            return;
        }

        if (this.course && !this.course.isLocked && !this.course.hasUnmetPrerequisites) {
            if (!this.hasQuizLesson) {
                return;
            }

            const quizLessonId = this.getUnlockedQuizLessonId();
            if (!quizLessonId) {
                return;
            }

            this.router.navigate(['quiz', quizLessonId], { relativeTo: this.route });
        }
    }

    /**
     * Navigate to specific lesson
     */
    onLessonClick(lesson: AcademySidebarLessonItem): void {
        if (!this.authService.isAuthenticated()) {
            this.showSignInPrompt = true;
            return;
        }

        if (!lesson.isLocked) {
            if (lesson.type === 'quiz') {
                this.router.navigate(['quiz', lesson.id], { relativeTo: this.route });
            } else {
                // Updated path from academy routes
                this.router.navigate(['lesson', lesson.id], { relativeTo: this.route });
            }
        }
    }

    closeSignInPrompt(): void {
        this.showSignInPrompt = false;
    }

    continueToSignIn(): void {
        this.showSignInPrompt = false;
        void this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
        });
    }
}

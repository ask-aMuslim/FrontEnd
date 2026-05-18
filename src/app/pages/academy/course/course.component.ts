import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import {
    AcademyProgressService,
    CourseEnrollmentState,
} from '../../../core/services/academy-progress.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { QuizReadDto } from '../../../api/facades/quiz.facade';
import { AuthService } from '../../../core/services/auth.service';
import {
    AcademyPageShellComponent,
    AcademyBreadcrumbItem,
} from '../shared/academy-page-shell/academy-page-shell.component';
import {
    AcademySidebarLessonItem,
} from '../shared/academy-course-sidebar/academy-course-sidebar.component';
import { AcademySidebarHostComponent } from '../shared/academy-sidebar-host/academy-sidebar-host.component';
import {
    AcademyCourse,
    AcademyLesson,
    AcademyStageApi,
    CourseProgress,
    LessonProgress,
} from '../../../core/models/interfaces/academy-progress.model';

/**
 * Lesson interface for template binding
 */
interface Lesson {
    id: string;
    quizLessonId?: string;
    title: string;
    duration: string;
    type: 'intro' | 'video' | 'article' | 'document' | 'quiz' | 'audio';
    isLocked: boolean;
    isCompleted: boolean;
    isCurrent: boolean;
    isLastCourseLesson?: boolean;
    hasNotification?: boolean;
}

/**
 * Course details interface for template binding
 */
interface CourseDetails {
    id: string;
    stageNumber: number;
    stageLabel: string;
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
    isEnrolled: boolean;
    isEnrollmentCompleted: boolean;
    lessonsList: Lesson[];
    prerequisitesList: { id: string; title: string; isCompleted: boolean }[];
}

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [RouterLink, AcademyPageShellComponent, AcademySidebarHostComponent],
    templateUrl: './course.component.html',
    styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit, OnDestroy {
    private static readonly syntheticQuizLessonPrefix = 'synthetic-quiz-';

    private readonly destroy$ = new Subject<void>();
    private courseId: string = '';

    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly academyProgressService = inject(AcademyProgressService);
    private readonly quizzesService = inject(QuizzesService);
    private readonly authService = inject(AuthService);
    private readonly cdr = inject(ChangeDetectorRef);

    // Course data loaded from service
    course: CourseDetails | null = null;

    // Loading and error states
    isLoading = true;
    error: string | null = null;
    showSignInPrompt = false;
    isEnrolling = false;

    backgroundImageUrl =
        '/backgrounds/course-background.png'; // Default background image for all courses (can be customized per course if needed)

    get hasPlayableLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => !lesson.isLocked && lesson.type !== 'quiz',
        );
    }

    get hasPublishedLessons(): boolean {
        return !!this.course?.lessonsList.length;
    }

    get hasQuizLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => !lesson.isLocked && lesson.type === 'quiz',
        );
    }

    get hasCourseEnrollment(): boolean {
        return !!this.course && (this.course.isEnrolled || this.course.isEnrollmentCompleted);
    }

    get canTakeQuiz(): boolean {
        return this.hasQuizLesson && this.hasCourseEnrollment;
    }

    get primaryActionLabel(): string {
        return this.hasCourseEnrollment ? 'Continue' : 'Enroll';
    }

    get isBeginDisabled(): boolean {
        if (!this.course) {
            return true;
        }

        return (
            !this.hasPublishedLessons ||
            !this.hasPlayableLesson
        );
    }

    private getUnlockedQuizLessonId(): string | null {
        const quizLesson = this.course?.lessonsList.find(
            (lesson) => !lesson.isLocked && lesson.type === 'quiz',
        );

        if (!quizLesson) {
            return null;
        }

        if (quizLesson.quizLessonId) {
            return quizLesson.quizLessonId;
        }

        if (quizLesson.id.startsWith(CourseComponent.syntheticQuizLessonPrefix)) {
            return null;
        }

        return quizLesson?.id ?? null;
    }

    get isUserAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    readonly breadcrumbs: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

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

        this.academyProgressService.getAcademyCourseById(this.courseId).pipe(
            takeUntil(this.destroy$),
            switchMap(courseData => {
                const prerequisites = courseData.prerequisites ?? [];
                return combineLatest([
                    of(courseData),
                    this.academyProgressService.getTargetedCourseProgress(this.courseId).pipe(catchError(() => of(undefined))),
                    this.academyProgressService.getCourseLessonsWithProgress(this.courseId).pipe(catchError(() => of([]))),
                    this.academyProgressService.getAcademyStages().pipe(catchError(() => of([]))),
                    this.academyProgressService.getCurrentStudentCourseEnrollment(this.courseId).pipe(catchError(() => of(undefined))),
                    this.quizzesService.getAll({ courseId: this.courseId, pageSize: 200 }).pipe(catchError(() => of([]))),
                    this.academyProgressService.getTargetedPrerequisiteDetails(prerequisites).pipe(catchError(() => of([])))
                ]);
            })
        ).subscribe({
            next: ([
                courseData,
                courseProgress,
                lessonsWithProgress,
                stages,
                enrollmentState,
                quizzes,
                prerequisitesList
            ]) => {
                // If course didn't load properly, fallback
                if (!courseData || courseData.id !== this.courseId) {
                    this.error = 'This course is unavailable right now.';
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    return;
                }

                const safeEnrollmentState = enrollmentState || { enrollmentId: null, status: null, isEnrolled: false, isCompleted: false };

                this.course = this.buildCourseDetails(
                    courseData,
                    courseProgress,
                    lessonsWithProgress,
                    stages,
                    safeEnrollmentState,
                    quizzes,
                    prerequisitesList
                );
                this.error = null;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.error = 'Unable to load this course right now. Please try again.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Build CourseDetails from service data
     */
    private buildCourseDetails(
        courseData: AcademyCourse,
        courseProgress: CourseProgress | undefined,
        lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[],
        stages: AcademyStageApi[],
        enrollmentState: CourseEnrollmentState,
        quizzes: QuizReadDto[],
        prerequisitesList: { id: string, title: string, isCompleted: boolean }[],
    ): CourseDetails {
        const matchedStage =
            stages.find((stage) => stage.id === courseData.levelId)
            ?? stages.find((stage) => stage.number === courseData.stageId);

        const stageNumber = matchedStage?.number ?? courseData.stageId ?? 1;

        const isLocked = this.isUserAuthenticated
            ? courseProgress?.status === 'locked' && stageNumber > 1
            : false;

        const unmetPrerequisites = prerequisitesList.filter(p => !p.isCompleted);
        const unmetPrerequisiteNames = unmetPrerequisites.map(p => p.title);
        const hasUnmetPrerequisites = unmetPrerequisiteNames.length > 0;

        const isEnrolled = this.isUserAuthenticated && enrollmentState.isEnrolled;
        const isEnrollmentCompleted = this.isUserAuthenticated && enrollmentState.isCompleted;

        const courseLessonIds = new Set(lessonsWithProgress.map((lesson) => lesson.id));
        const scopedQuizzes = quizzes.filter((quiz) => {
            const lessonId = typeof quiz.lessonId === 'string' ? quiz.lessonId.trim() : '';
            return lessonId.length === 0 || courseLessonIds.has(lessonId);
        });

        const sidebarLessons = this.ensureSidebarHasQuizLesson(
            lessonsWithProgress.map((lesson) =>
                this.mapLessonForDisplay(lesson, isLocked || hasUnmetPrerequisites, false, null)
            ),
            scopedQuizzes,
            isLocked || hasUnmetPrerequisites,
        );

        const aggregatedVideoDuration = this.academyProgressService.calculateCourseVideoDuration(
            lessonsWithProgress,
            '0m',
        );

        let stageLabel = `Stage ${stageNumber}`;
        if (matchedStage) {
            stageLabel = `Stage ${matchedStage.number}: ${matchedStage.title}`;
        }

        return {
            id: courseData.id,
            stageNumber,
            stageLabel,
            title: courseData.title,
            intro:
                courseData.description ||
                "In this course, you'll learn comprehensive content designed to guide you step by step through important Islamic teachings.",
            lessons: lessonsWithProgress
                .filter((l) => l.type !== 'quiz' && l.type !== 'intro')
                .map((l) => l.title),
            answers: this.extractOutcomes(courseData.description),
            totalLessons: lessonsWithProgress.length,
            completedLessons: lessonsWithProgress.filter((l) => l.progress.isCompleted).length,
            duration: aggregatedVideoDuration,
            isLocked,
            hasUnmetPrerequisites,
            unmetPrerequisiteNames,
            isEnrolled,
            isEnrollmentCompleted,
            lessonsList: sidebarLessons,
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
        courseLocked: boolean,
        allowCurrentLesson: boolean = true,
        lastContentLessonId: string | null = null,
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
        const isCurrent = allowCurrentLesson && lesson.progress.status === 'current';

        return {
            id: lesson.id,
            quizLessonId: lesson.type === 'quiz' ? lesson.id : undefined,
            title: lesson.title,
            duration: lesson.duration,
            type: lesson.type,
            isLocked,
            isCompleted,
            isCurrent,
            isLastCourseLesson:
                allowCurrentLesson
                && isCurrent
                && !!lastContentLessonId
                && lesson.id === lastContentLessonId,
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

        if (!this.course || this.course.isLocked || this.course.hasUnmetPrerequisites || this.isBeginDisabled) {
            return;
        }

        if (!this.hasPlayableLesson || this.isEnrolling) {
            return;
        }

        if (this.hasCourseEnrollment) {
            this.navigateToPrimaryActionLesson(true);
            return;
        }

        this.navigateToPrimaryActionLesson(false);
        this.enrollCurrentStudentInBackground(this.course.id);
    }

    private navigateToPrimaryActionLesson(preferNextUncompleted: boolean): void {
        if (!this.course) {
            return;
        }

        const unlockedNonQuizLessons = this.course.lessonsList.filter(
            (lesson) => !lesson.isLocked && lesson.type !== 'quiz',
        );

        if (unlockedNonQuizLessons.length === 0) {
            return;
        }

        const nextUncompletedLesson = unlockedNonQuizLessons.find((lesson) => !lesson.isCompleted);
        const targetLesson = preferNextUncompleted
            ? (nextUncompletedLesson ?? unlockedNonQuizLessons[0])
            : unlockedNonQuizLessons[0];

        this.router.navigate(['lesson', targetLesson.id], { relativeTo: this.route });
        this.cdr.detectChanges();
    }

    private enrollCurrentStudentInBackground(courseId: string): void {
        this.academyProgressService
            .enrollCurrentStudentInCourse(courseId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (isEnrolled) => {
                    if (!isEnrolled || this.course?.id !== courseId) {
                        return;
                    }

                    this.course = {
                        ...this.course,
                        isEnrolled: true,
                        isEnrollmentCompleted: this.course.isEnrollmentCompleted,
                    };
                    this.cdr.detectChanges();
                },
                error: () => void 0,
            });
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
            if (quizLessonId) {
                this.router.navigate(['quiz', quizLessonId], { relativeTo: this.route });
                return;
            }

            this.router.navigate(['quiz'], { relativeTo: this.route });
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
                const quizLessonId = lesson.quizLessonId
                    ?? (lesson.id.startsWith(CourseComponent.syntheticQuizLessonPrefix) ? null : lesson.id);

                if (quizLessonId) {
                    this.router.navigate(['quiz', quizLessonId], { relativeTo: this.route });
                } else {
                    this.router.navigate(['quiz'], { relativeTo: this.route });
                }
            } else {
                // Updated path from academy routes
                this.router.navigate(['lesson', lesson.id], { relativeTo: this.route });
            }
        }
    }

    private ensureSidebarHasQuizLesson(
        lessons: Lesson[],
        quizzes: QuizReadDto[],
        isLocked: boolean,
    ): Lesson[] {
        // First, look for a course quiz (quiz without a specific lessonId)
        const courseQuiz = quizzes.find(
            (quiz) => !quiz.lessonId || (typeof quiz.lessonId === 'string' && quiz.lessonId.trim().length === 0),
        );

        const quizLesson = lessons.find(
            (lesson) => lesson.type === 'quiz' && !lesson.id.startsWith(CourseComponent.syntheticQuizLessonPrefix),
        );

        // Determine which quiz to use as fallback
        let fallbackCourseQuiz = courseQuiz;
        if (!fallbackCourseQuiz && quizLesson) {
            fallbackCourseQuiz = quizzes.find((quiz) => quiz.lessonId === quizLesson.id);
        }
        fallbackCourseQuiz ??= quizzes.find((quiz) => typeof quiz.title === 'string' && quiz.title.trim().length > 0);

        // Determine quizLessonId: use quiz lesson if we have one, else undefined
        const quizLessonId = quizLesson?.id ?? undefined;

        const quizTitle = fallbackCourseQuiz?.title?.trim() || 'Quiz';

        const lessonsWithQuizTitle = lessons.map((lesson) =>
            lesson.type === 'quiz'
                ? {
                    ...lesson,
                    title: quizTitle,
                    duration: 'Assessment',
                }
                : lesson
        );

        if (lessonsWithQuizTitle.some((lesson) => lesson.type === 'quiz') || quizzes.length === 0) {
            return lessonsWithQuizTitle;
        }

        return [
            ...lessonsWithQuizTitle,
            {
                id: `${CourseComponent.syntheticQuizLessonPrefix}${quizLessonId ?? this.courseId}`,
                quizLessonId,
                title: quizTitle,
                duration: 'Assessment',
                type: 'quiz',
                isLocked,
                isCompleted: false,
                isCurrent: false,
                hasNotification: false,
            },
        ];
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

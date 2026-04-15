import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { ACADEMY_COURSES } from '../../../core/services/academy-data';
import { LessonsService } from '../../../core/services/lessons.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import {
    AcademyBreadcrumbItem,
    AcademyPageShellComponent,
} from '../shared/academy-page-shell/academy-page-shell.component';

@Component({
    selector: 'app-congratulations',
    standalone: true,
    imports: [AcademyPageShellComponent],
    templateUrl: './congratulations.component.html',
    styleUrls: ['./congratulations.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CongratulationsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    courseId = '';
    private feedbackLessonId: string | null = null;

    readonly bannerImageUrl = '/backgrounds/course-background.png';
    readonly stars: readonly number[] = [1, 2, 3, 4, 5];

    readonly courseTitle = signal<string>('Prayer (Salah)');
    readonly nextCourseName = signal<string>('Prophet Mohamed’s Journey');
    readonly rating = signal<number>(0);
    readonly feedbackText = signal<string>('');
    readonly isSubmittingFeedback = signal<boolean>(false);
    readonly feedbackSubmissionMessage = signal<string | null>(null);
    readonly feedbackSubmissionStatus = signal<'success' | 'error' | null>(null);

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    readonly breadcrumbs = computed<readonly AcademyBreadcrumbItem[]>(() => {
        const title = this.courseTitle().trim();

        if (!title) {
            return [...this.breadcrumbsBase];
        }

        return [
            ...this.breadcrumbsBase,
            {
                label: title,
                link: ['/academy/course', this.courseId],
            },
        ];
    });

    readonly canSubmitFeedback = computed(() => {
        if (this.isSubmittingFeedback()) {
            return false;
        }

        return this.rating() > 0 || this.feedbackText().trim().length > 0;
    });

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly academyProgressService: AcademyProgressService,
        private readonly lessonsService: LessonsService,
        private readonly quizzesService: QuizzesService,
    ) { }

    get currentBreadcrumb(): string {
        return 'Quiz';
    }

    ngOnInit(): void {
        combineLatest([this.route.paramMap, this.route.queryParamMap])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([params, queryParams]) => {
                this.courseId = params.get('courseId') ?? '';
                this.feedbackLessonId = queryParams.get('lessonId');

                this.feedbackSubmissionMessage.set(null);
                this.feedbackSubmissionStatus.set(null);

                this.loadCourseTitle();
                this.resolveFeedbackLessonId();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    setRating(value: number): void {
        const normalizedRating = Math.max(0, Math.min(5, value));
        this.rating.set(normalizedRating);
        this.feedbackSubmissionMessage.set(null);
        this.feedbackSubmissionStatus.set(null);
    }

    updateFeedback(value: string): void {
        this.feedbackText.set(value);
        this.feedbackSubmissionMessage.set(null);
        this.feedbackSubmissionStatus.set(null);
    }

    onFeedbackInput(event: Event): void {
        const target = event.target;
        if (!(target instanceof HTMLTextAreaElement)) {
            return;
        }

        this.updateFeedback(target.value);
    }

    submitFeedback(): void {
        if (!this.canSubmitFeedback()) {
            return;
        }

        const lessonId = this.feedbackLessonId?.trim() ?? '';
        if (!lessonId) {
            this.rating.set(0);
            this.feedbackText.set('');
            this.feedbackSubmissionStatus.set('success');
            this.feedbackSubmissionMessage.set('Thank you for your feedback!');
            return;
        }

        const trimmedFeedback = this.feedbackText().trim();

        this.isSubmittingFeedback.set(true);
        this.feedbackSubmissionMessage.set(null);
        this.feedbackSubmissionStatus.set(null);

        this.lessonsService
            .submitFeedback(lessonId, {
                rating: this.rating(),
                feedback: trimmedFeedback.length > 0 ? trimmedFeedback : undefined,
            })
            .pipe(
                takeUntil(this.destroy$),
                catchError(() => of(false)),
            )
            .subscribe((submitted) => {
                this.isSubmittingFeedback.set(false);

                if (submitted) {
                    this.rating.set(0);
                    this.feedbackText.set('');
                    this.feedbackSubmissionStatus.set('success');
                    this.feedbackSubmissionMessage.set('Thank you for your feedback!');
                    return;
                }

                this.feedbackSubmissionStatus.set('error');
                this.feedbackSubmissionMessage.set('Unable to submit feedback right now. Please try again.');
            });
    }

    goToNextCourse(): void {
        void this.router.navigate(['/academy']);
    }

    private loadCourseTitle(): void {
        if (!this.courseId) {
            return;
        }

        const cachedCourse = this.academyProgressService.getCourseById(this.courseId);
        if (cachedCourse?.title?.trim()) {
            this.courseTitle.set(cachedCourse.title);
        }

        const staticCourse = ACADEMY_COURSES.find((course) => course.id === this.courseId);
        if (staticCourse?.title?.trim()) {
            this.courseTitle.set(staticCourse.title);
        }

        this.academyProgressService
            .getAcademyCourseById(this.courseId)
            .pipe(
                takeUntil(this.destroy$),
                catchError(() => of(null)),
            )
            .subscribe((course) => {
                const normalizedTitle = course?.title?.trim() ?? '';
                if (!normalizedTitle || normalizedTitle.toLowerCase() === 'unknown course') {
                    return;
                }

                this.courseTitle.set(normalizedTitle);
            });
    }

    private resolveFeedbackLessonId(): void {
        if (!this.courseId) {
            return;
        }

        const routeLessonId = this.feedbackLessonId?.trim() ?? '';
        if (routeLessonId) {
            this.feedbackLessonId = routeLessonId;
            return;
        }

        const cachedQuizLessonId = this.academyProgressService.getQuizLessonOfCourse(this.courseId)?.id;
        if (cachedQuizLessonId) {
            this.feedbackLessonId = cachedQuizLessonId;
            return;
        }

        this.academyProgressService
            .getAcademyLessons(this.courseId)
            .pipe(
                takeUntil(this.destroy$),
                catchError(() => of([])),
            )
            .subscribe((lessons) => {
                if (this.feedbackLessonId?.trim()) {
                    return;
                }

                const quizLesson = lessons.find((lesson) => lesson.type === 'quiz');
                if (quizLesson?.id) {
                    this.feedbackLessonId = quizLesson.id;
                    return;
                }

                this.resolveFeedbackLessonIdFromQuizzes();
            });
    }

    private resolveFeedbackLessonIdFromQuizzes(): void {
        this.quizzesService
            .getAll({
                courseId: this.courseId,
                pageSize: 200,
            })
            .pipe(
                takeUntil(this.destroy$),
                catchError(() => of([])),
            )
            .subscribe((quizzes) => {
                if (this.feedbackLessonId?.trim()) {
                    return;
                }

                const quizWithLessonId = quizzes.find((quiz) => {
                    return typeof quiz.lessonId === 'string' && quiz.lessonId.trim().length > 0;
                });

                const resolvedLessonId = quizWithLessonId?.lessonId?.trim() ?? '';
                if (resolvedLessonId) {
                    this.feedbackLessonId = resolvedLessonId;
                }
            });
    }
}

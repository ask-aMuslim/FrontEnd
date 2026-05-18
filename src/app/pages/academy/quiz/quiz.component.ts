import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, combineLatest, forkJoin, interval, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { OptionsService } from '../../../core/services/options.service';
import { QuizAttemptsService } from '../../../core/services/quiz-attempts.service';
import { QuizAnswerDto } from '../../../api/models/quiz-answer-dto';
import { ACADEMY_COURSES, ACADEMY_LESSONS } from '../../../core/services/academy-data';
import { AcademyCourse, AcademyLesson, LessonProgress } from '../../../core/models/interfaces/academy-progress.model';
import {
    AcademyBreadcrumbItem,
    AcademyPageShellComponent,
} from '../shared/academy-page-shell/academy-page-shell.component';
import { AcademySidebarLessonItem } from '../shared/academy-course-sidebar/academy-course-sidebar.component';
import { AcademySidebarHostComponent } from '../shared/academy-sidebar-host/academy-sidebar-host.component';

// Quiz Question Interface
interface QuizQuestion {
    readonly id: string;
    readonly questionNumber: number;
    readonly questionText: string;
    readonly options: readonly QuizOption[];
    readonly correctOptionId: string;
    readonly hint?: string;
    readonly evidenceSource?: string;
}

interface QuizOption {
    readonly id: string;
    readonly label: string;
    readonly text: string;
}

type SidebarLessonType = 'intro' | 'video' | 'article' | 'document' | 'quiz' | 'audio';

interface QuizAnswer {
    readonly questionId: string;
    readonly selectedOptionId: string | null;
    readonly isCorrect: boolean;
    readonly isSkipped: boolean;
}

interface StoredQuizAnswer {
    readonly questionId: string;
    readonly questionIndex?: number;
    readonly selectedOptionId: string | null;
    readonly isCorrect?: boolean;
    readonly isSkipped: boolean;
}

interface StoredQuizResult {
    readonly completed: boolean;
    readonly score: number;
    readonly passed: boolean;
    readonly completionTime: number;
    readonly timestamp: string;
    readonly questionCount: number;
    readonly answers: readonly StoredQuizAnswer[];
}

type QuizState = 'intro' | 'in-progress' | 'review' | 'results';

interface CourseInfo {
    stage: number | null;
    title: string;
    totalLessons: number | null;
    currentLesson: number | null;
    duration: string;
}

@Component({
    selector: 'app-quiz',
    standalone: true,
    imports: [FormsModule, AcademyPageShellComponent, AcademySidebarHostComponent],
    templateUrl: './quiz.component.html',
    styleUrls: ['./quiz.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent implements OnInit, OnDestroy {
    private static readonly optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    private static readonly questionNumberOffset = 1;
    private static readonly syntheticQuizLessonPrefix = 'synthetic-quiz-';
    private static readonly questionsPageSize = 1000;
    // Route params
    courseId = '';
    lessonId = '';
    currentCourse: AcademyCourse | undefined;

    get bannerImageUrl(): string {
        return this.currentCourse?.thumbnailUrl || '/backgrounds/course-background.png';
    }

    get bannerAlt(): string {
        return 'Quiz background';
    }

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [

        { label: 'Academy', link: ['/academy'] },
    ];

    // Course info
    readonly courseInfo = signal<CourseInfo>({
        stage: null,
        title: '',
        totalLessons: null,
        currentLesson: null,
        duration: '',
    });

    // Quiz configuration
    readonly quizConfig = {
        totalQuestions: 10,
        timePerQuestion: 600, // seconds (10 minutes - exact Figma requirement)
    };

    // Quiz state
    readonly quizState = signal<QuizState>('intro');
    readonly isSidebarCollapsed = signal(false);
    readonly currentQuestionIndex = signal(0);
    readonly timeRemaining = signal(this.quizConfig.timePerQuestion);
    readonly showHint = signal(false);
    readonly selectedOptionId = signal<string | null>(null);

    // Results state (when quiz was previously completed)
    readonly previousScore = signal<number>(0);
    readonly previousCompletionTime = signal<number>(0);
    readonly wasPreviouslyPassed = signal<boolean>(false);

    // Quiz timing
    private quizStartTime = 0;
    readonly quizCompletionTime = signal(0); // in seconds

    // Quiz data
    readonly questions = signal<QuizQuestion[]>([]);
    readonly activeQuizId = signal<string | null>(null);
    readonly activeAttemptId = signal<string | null>(null);
    readonly answers = signal<QuizAnswer[]>([]);

    // Computed values
    readonly currentQuestion = computed(() => this.questions()[this.currentQuestionIndex()]);
    readonly isLastQuestion = computed(() => this.currentQuestionIndex() === this.questions().length - 1);
    readonly isFirstQuestion = computed(() => this.currentQuestionIndex() === 0);
    readonly displayQuestionCount = computed(() =>
        this.questions().length > 0
            ? this.questions().length
            : this.quizConfig.totalQuestions,
    );

    readonly correctAnswersCount = computed(() =>
        this.answers().filter(a => a.isCorrect).length
    );

    readonly effectiveCorrectAnswersCount = computed(() => {
        const restoredResult = this.restoredQuizResult;
        const hasAnsweredQuestions = this.answers().some(
            (answer) => answer.selectedOptionId !== null || answer.isSkipped,
        );

        if ((this.quizState() === 'results' || this.quizState() === 'review') && !hasAnsweredQuestions && restoredResult?.completed) {
            return restoredResult.score;
        }

        return this.correctAnswersCount();
    });

    readonly wrongAnswersCount = computed(() =>
        this.answers().filter(a => !a.isCorrect && !a.isSkipped).length
    );

    readonly skippedCount = computed(() =>
        this.answers().filter(a => a.isSkipped).length
    );

    readonly scorePercentage = computed(() => {
        const restoredResult = this.restoredQuizResult;
        const total = this.questions().length || restoredResult?.questionCount || this.quizConfig.totalQuestions;
        if (total === 0) return 0;
        return Math.round((this.effectiveCorrectAnswersCount() / total) * 100);
    });

    readonly requiredPassingScore = computed(() => {
        const restoredResult = this.restoredQuizResult;
        const total = this.questions().length || restoredResult?.questionCount || this.quizConfig.totalQuestions;
        return Math.ceil(total * 0.5);
    });

    readonly hasPassed = computed(() =>
        this.effectiveCorrectAnswersCount() >= this.requiredPassingScore()
    );

    readonly hasSuccessfulDegree = computed(() => {
        const hasAnsweredQuestions = this.answers().some(
            (answer) => answer.selectedOptionId !== null || answer.isSkipped,
        );

        if ((this.quizState() === 'results' || this.quizState() === 'review') && this.restoredQuizResult?.completed) {
            if (this.restoredQuizResult.passed) {
                return true;
            }

            if (!hasAnsweredQuestions) {
                return this.restoredQuizResult.score >= this.requiredPassingScore();
            }
        }

        return this.hasPassed();
    });

    readonly formattedTime = computed(() => {
        const minutes = Math.floor(this.timeRemaining() / 60);
        const seconds = this.timeRemaining() % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });

    readonly timerProgress = computed(() => {
        const percentage = (this.timeRemaining() / this.quizConfig.timePerQuestion) * 100;
        // Return the progress for the circular arc (0-100%)
        return percentage;
    });

    readonly timerDegrees = computed(() => {
        // Calculate degrees for SVG arc (270 degrees total for 3/4 circle)
        const percentage = this.timerProgress();
        return (percentage / 100) * 270;
    });

    readonly nextQuizLessonId = computed(() => this.resolveNextQuizLessonId());
    readonly nextPassedActionLabel = computed(() =>
        this.nextQuizLessonId() ? 'Next Quiz' : 'Pass',
    );

    readonly formattedCompletionTime = computed(() => {
        const totalSeconds = this.quizCompletionTime();
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
            const suffix = minutes > 1 ? 's' : '';
            return `${minutes} minute${suffix}`;
        }
        const suffix = seconds > 1 ? 's' : '';
        return `${seconds} second${suffix}`;
    });

    // Lessons for sidebar
    readonly lessons = signal<AcademySidebarLessonItem[]>([]);
    readonly courseLessons = signal<Array<AcademyLesson & { progress: LessonProgress }>>([]);
    private courseQuizTitle = 'Quiz';
    private courseQuizLessonId: string | null = null;

    private readonly destroy$ = new Subject<void>();
    private timerSubscription?: Subject<void>;
    private isFinishingQuiz = false;
    private hasSyncedPassedQuizCompletion = false;
    private readonly isBrowser: boolean;
    private restoredQuizResult: StoredQuizResult | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly quizzesService: QuizzesService,
        private readonly questionsService: QuestionsService,
        private readonly optionsService: OptionsService,
        private readonly quizAttemptsService: QuizAttemptsService,
        private readonly academyProgressService: AcademyProgressService,
        private readonly scrollService: ScrollService,
        @Inject(PLATFORM_ID) private readonly platformId: object
    ) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    get breadcrumbs(): readonly AcademyBreadcrumbItem[] {
        const courseTitle = this.courseInfo().title.trim();

        return courseTitle.length > 0
            ? [
                ...this.breadcrumbsBase,
                {
                    label: courseTitle,
                    link: ['/academy/course', this.courseId],
                },
            ]
            : [...this.breadcrumbsBase];
    }

    get currentBreadcrumb(): string {
        const state = this.quizState();
        if (state === 'review' || state === 'results') {
            return 'Quiz Review';
        }
        return 'Quiz';
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.courseId = params.get('courseId') || '';
            this.lessonId = params.get('lessonId') || '';
            this.resetQuizStateForRoute();
            this.loadCourseInfo();
            this.loadQuizData();
            this.checkPreviousCompletion();
        });
    }

    private resetQuizStateForRoute(): void {
        this.stopTimer();
        this.isFinishingQuiz = false;
        this.hasSyncedPassedQuizCompletion = false;
        this.quizStartTime = 0;
        this.restoredQuizResult = null;

        this.quizState.set('intro');
        this.currentQuestionIndex.set(0);
        this.timeRemaining.set(this.quizConfig.timePerQuestion);
        this.showHint.set(false);
        this.selectedOptionId.set(null);

        this.activeQuizId.set(null);
        this.activeAttemptId.set(null);
        this.questions.set([]);
        this.answers.set([]);
        this.courseLessons.set([]);

        this.quizCompletionTime.set(0);
    }

    private checkPreviousCompletion(): void {
        // Only access localStorage in browser environment
        if (!this.isBrowser) {
            return;
        }

        // Check localStorage for previous quiz completion
        const storageKey = `quiz_${this.courseId}_${this.lessonId}`;
        const storedData = localStorage.getItem(storageKey);

        if (!storedData) {
            return;
        }

        const parsedResult = this.parseStoredQuizResult(storedData);
        if (!parsedResult?.completed) {
            this.previousScore.set(0);
            this.previousCompletionTime.set(0);
            this.wasPreviouslyPassed.set(false);
            return;
        }

        this.restoredQuizResult = parsedResult;
        this.previousScore.set(parsedResult.score);
        this.previousCompletionTime.set(parsedResult.completionTime);
        this.wasPreviouslyPassed.set(parsedResult.passed);
        this.quizCompletionTime.set(parsedResult.completionTime);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopTimer();
    }

    private loadCourseInfo(): void {
        if (!this.courseId) return;

        // Load course info from academy progress service
        const course = this.academyProgressService.getCourseById(this.courseId)
            ?? ACADEMY_COURSES.find((item) => item.id === this.courseId);
        if (course) {
            this.currentCourse = course;
            this.courseInfo.set({
                stage: course.stageId,
                title: course.title,
                totalLessons: course.lessons,
                currentLesson: course.lessons,
                duration: course.duration
            });
        }

        const staticLessons = this.getStaticLessonsForCourse();
        if (staticLessons.length > 0 && this.lessons().length === 0) {
            this.lessons.set(staticLessons.map((lesson) => this.mapStaticLessonToSidebarLesson(lesson)));

            const staticQuizLesson = staticLessons.find((lesson) => lesson.type === 'quiz');
            if (staticQuizLesson) {
                this.courseQuizTitle = staticQuizLesson.title;
                this.courseQuizLessonId = staticQuizLesson.id;
            }
        }

        combineLatest([
            this.academyProgressService.getCourseLessonsWithProgress(this.courseId),
            this.quizzesService.getAll({ courseId: this.courseId, pageSize: 200 }),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([lessons, quizzes]) => {
                    this.courseLessons.set(lessons);

                    const quizLesson = lessons.find((lesson) => this.mapLessonType(lesson.type) === 'quiz');
                    const linkedCourseQuiz = quizLesson
                        ? quizzes.find((quiz) => quiz.lessonId === quizLesson.id)
                        : undefined;
                    const fallbackCourseQuiz = linkedCourseQuiz
                        ?? quizzes.find((quiz) => typeof quiz.title === 'string' && quiz.title.trim().length > 0)
                        ?? null;

                    this.courseQuizTitle = fallbackCourseQuiz?.title?.trim() || 'Quiz';
                    this.courseQuizLessonId = linkedCourseQuiz?.lessonId?.trim() || quizLesson?.id || null;

                    const aggregatedDuration = this.academyProgressService.calculateCourseVideoDuration(
                        lessons,
                        this.courseInfo().duration,
                    );

                    this.courseInfo.update((current) => ({
                        ...current,
                        totalLessons: lessons.length,
                        currentLesson: lessons.length,
                        duration: aggregatedDuration,
                    }));

                    this.lessons.set(lessons.map((lesson) => {
                        const lessonType = this.mapLessonType(lesson.type);
                        return {
                            id: lesson.id,
                            quizLessonId: lessonType === 'quiz'
                                ? (this.courseQuizLessonId ?? lesson.id)
                                : undefined,
                            title: lessonType === 'quiz' ? this.courseQuizTitle : lesson.title,
                            duration: lessonType === 'quiz' ? 'Assessment' : lesson.duration,
                            type: lessonType,
                            isCompleted: lesson.progress.status === 'completed',
                            isLocked: lesson.progress.status === 'locked',
                            isCurrent: lessonType === 'quiz',
                            hasNotification: false
                        };
                    }));
                },
                error: () => { }
            });
    }

    private loadQuizData(): void {
        const query = this.lessonId
            ? { lessonId: this.lessonId, pageNumber: 1, pageSize: 200 }
            : { courseId: this.courseId, pageNumber: 1, pageSize: 200 };

        this.quizzesService.getAll(query)
            .pipe(
                switchMap((quizzes) => {
                    const hasQuizzes = quizzes.length > 0;
                    const canFallbackToQuizLesson = !hasQuizzes && !this.lessonId && !!this.courseId;

                    if (!canFallbackToQuizLesson) {
                        return of(quizzes);
                    }

                    return this.academyProgressService.getAcademyLessons(this.courseId).pipe(
                        map((lessons) => lessons.find((lesson) => lesson.type === 'quiz')?.id ?? null),
                        switchMap((quizLessonId) => {
                            if (!quizLessonId) {
                                return of(quizzes);
                            }

                            return this.quizzesService.getAll({ lessonId: quizLessonId, pageNumber: 1, pageSize: 200 });
                        }),
                        catchError(() => of(quizzes)),
                    );
                }),
                switchMap((quizzes) => {
                    const activeQuiz = quizzes[0];
                    if (!activeQuiz?.id) {
                        this.syncSidebarQuizLesson(null);
                        return of([] as QuizQuestion[]);
                    }

                    this.activeQuizId.set(activeQuiz.id);
                    this.syncSidebarQuizLesson(activeQuiz);
                    return this.buildQuestionsFromQuizId(activeQuiz.id);
                }),
                catchError(() => of([] as QuizQuestion[])),
                takeUntil(this.destroy$)
            )
            .subscribe((questions: QuizQuestion[]) => {
                this.questions.set(questions);
                this.initializeAnswers(questions);
                this.restoreQuizResultFromStorage(questions);
            });
    }

    private buildQuestionsFromQuizId(quizId: string): Observable<QuizQuestion[]> {
        return this.questionsService.getAllByQuizId(quizId, {
            pageNumber: 1,
            pageSize: QuizComponent.questionsPageSize,
        }).pipe(
            switchMap((questions) => {
                if (!questions.length) {
                    return of([] as QuizQuestion[]);
                }

                return forkJoin(questions.map((question, index) => this.loadQuestionWithOptions(question, index)));
            })
        );
    }

    private loadQuestionWithOptions(question: { id?: string; text?: string }, index: number) {
        return this.optionsService.getByQuestion(String(question.id ?? '')).pipe(
            map((options) => this.mapApiQuestion(question, options, index)),
            catchError(() => of(this.mapApiQuestion(question, [], index)))
        );
    }

    private initializeAnswers(questions: QuizQuestion[]): void {
        const initialAnswers: QuizAnswer[] = questions.map(q => ({
            questionId: q.id,
            selectedOptionId: null,
            isCorrect: false,
            isSkipped: false
        }));
        this.answers.set(initialAnswers);
    }

    private resetAnswersToDefault(): void {
        this.initializeAnswers(this.questions());
    }

    // Quiz Actions
    startQuiz(): void {
        if (this.questions().length === 0) {
            return;
        }

        this.markLastPublishedLessonCompletedForQuizStart();

        this.isFinishingQuiz = false;
        this.quizState.set('in-progress');
        this.currentQuestionIndex.set(0);
        this.selectedOptionId.set(null);
        this.showHint.set(false);
        this.quizStartTime = Date.now();
        // Scroll to top when starting quiz
        this.scrollService.scrollToTop();
        // Timer starts with quiz - 10 minutes total for entire quiz
        this.startTimer();

        const quizId = this.activeQuizId();
        if (quizId) {
            this.quizAttemptsService
                .startAttemptForQuiz(quizId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (attemptId) => this.activeAttemptId.set(attemptId),
                    error: () => this.activeAttemptId.set(null),
                });
        }
    }

    selectOption(optionId: string): void {
        this.selectedOptionId.set(optionId);
    }

    confirmAnswer(): void {
        const currentQ = this.currentQuestion();
        if (!currentQ) return;

        const selected = this.selectedOptionId();
        const isCorrect = selected === currentQ.correctOptionId;

        // Update answer
        const updatedAnswers = [...this.answers()];
        const answerIndex = updatedAnswers.findIndex(a => a.questionId === currentQ.id);
        if (answerIndex !== -1) {
            updatedAnswers[answerIndex] = {
                ...updatedAnswers[answerIndex],
                selectedOptionId: selected,
                isCorrect,
                isSkipped: false
            };
            this.answers.set(updatedAnswers);
        }

        // Move to next question or finish
        if (this.isLastQuestion()) {
            this.finishQuiz();
        } else {
            this.nextQuestion();
        }
    }

    skipQuestion(): void {
        const currentQ = this.currentQuestion();
        if (!currentQ) return;

        // Mark as skipped
        const updatedAnswers = [...this.answers()];
        const answerIndex = updatedAnswers.findIndex(a => a.questionId === currentQ.id);
        if (answerIndex !== -1) {
            updatedAnswers[answerIndex] = {
                ...updatedAnswers[answerIndex],
                selectedOptionId: null,
                isCorrect: false,
                isSkipped: true
            };
            this.answers.set(updatedAnswers);
        }

        if (this.isLastQuestion()) {
            this.finishQuiz();
        } else {
            this.nextQuestion();
        }
    }

    nextQuestion(): void {
        if (!this.isLastQuestion()) {
            this.currentQuestionIndex.update(i => i + 1);
            this.selectedOptionId.set(null);
            this.showHint.set(false);
            // Scroll to top when moving to next question
            this.scrollService.scrollToTop();
            // Timer continues running - do not reset for each question
        }
    }

    goToQuestion(index: number): void {
        if (index >= 0 && index < this.questions().length) {
            this.currentQuestionIndex.set(index);
            const answer = this.answers()[index];
            this.selectedOptionId.set(answer?.selectedOptionId || null);
            this.showHint.set(false);
            // Scroll to top when jumping to a question
            this.scrollService.scrollToTop();
        }
    }

    toggleHint(): void {
        this.showHint.update(v => !v);
    }

    toggleSidebar(): void {
        this.isSidebarCollapsed.update(v => !v);
    }

    private finishQuiz(): void {
        if (this.isFinishingQuiz) {
            return;
        }
        this.isFinishingQuiz = true;
        this.stopTimer();

        // Calculate completion time
        const completionTimeMs = Date.now() - this.quizStartTime;
        this.quizCompletionTime.set(Math.floor(completionTimeMs / 1000)); // Convert to seconds

        this.quizState.set('review');
        // Scroll to top when quiz finishes and shows review
        this.scrollService.scrollToTop();

        // Save quiz results to localStorage
        const storageKey = `quiz_${this.courseId}_${this.lessonId}`;
        const quizData: StoredQuizResult = {
            completed: true,
            score: this.correctAnswersCount(),
            passed: this.hasPassed(),
            completionTime: this.quizCompletionTime(),
            timestamp: new Date().toISOString(),
            questionCount: this.questions().length,
            answers: this.answers().map((answer, index) => ({
                questionId: answer.questionId,
                questionIndex: index,
                selectedOptionId: answer.selectedOptionId,
                isCorrect: answer.isCorrect,
                isSkipped: answer.isSkipped,
            })),
        };
        if (this.isBrowser) {
            localStorage.setItem(storageKey, JSON.stringify(quizData));
        }

        if (this.hasPassed()) {
            this.syncPassedQuizCompletion();
        }

        const attemptId = this.activeAttemptId();
        if (attemptId) {
            this.activeAttemptId.set(null);
            const answersPayload = this.buildQuizAnswerPayload();
            const allQuestionsAnswered = answersPayload.length === this.questions().length;
            if (allQuestionsAnswered) {
                this.quizAttemptsService
                    .completeAttempt(attemptId, answersPayload)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => void 0,
                        error: () => void 0,
                    });
            }
        }

    }

    retakeQuiz(): void {
        this.resetAnswersToDefault();
        this.activeAttemptId.set(null);
        this.isFinishingQuiz = false;
        this.hasSyncedPassedQuizCompletion = false;
        this.currentQuestionIndex.set(0);
        this.selectedOptionId.set(null);
        this.showHint.set(false);
        // Scroll to top when starting to retake quiz
        this.scrollService.scrollToTop();
        this.startQuiz();
    }

    onPassedNextActionClick(): void {
        if (!this.hasSuccessfulDegree()) {
            return;
        }

        this.syncPassedQuizCompletion();

        const nextQuizLessonId = this.nextQuizLessonId();

        if (nextQuizLessonId) {
            void this.router.navigate(['/academy/course', this.courseId, 'quiz', nextQuizLessonId]);
            return;
        }

        const currentQuizLessonId = this.resolveCurrentQuizLessonId();

        void this.router.navigate(['/academy/course', this.courseId, 'congratulations'], {
            queryParams: currentQuizLessonId ? { lessonId: currentQuizLessonId } : {},
        });
    }

    goToPreviousLesson(): void {
        const lastLessonId = this.resolveLastPublishedLessonIdBeforeCurrentQuiz();
        if (lastLessonId) {
            void this.router.navigate(['/academy/course', this.courseId, 'lesson', lastLessonId]);
            return;
        }

        // Fallback to the course page if a previous lesson cannot be resolved.
        void this.router.navigate(['/academy/course', this.courseId]);
    }

    onLessonSelect(lesson: AcademySidebarLessonItem): void {
        // Navigate to the selected lesson or quiz
        if (lesson.type === 'quiz') {
            const targetQuizLessonId = lesson.quizLessonId && lesson.quizLessonId !== this.courseId
                ? lesson.quizLessonId
                : this.resolveCurrentQuizLessonId();
            if (targetQuizLessonId) {
                void this.router.navigate(['/academy/course', this.courseId, 'quiz', targetQuizLessonId]);
                return;
            }

            void this.router.navigate(['quiz'], {
                relativeTo: this.route.parent,
            });
        } else {
            // Navigate to lesson - use absolute path to course/lesson
            void this.router.navigate(['/academy/course', this.courseId, 'lesson', lesson.id]);
        }
    }

    // Timer methods
    private startTimer(): void {
        this.timerSubscription = new Subject<void>();
        this.timeRemaining.set(this.quizConfig.timePerQuestion);

        interval(1000)
            .pipe(takeUntil(this.timerSubscription), takeUntil(this.destroy$))
            .subscribe(() => {
                const current = this.timeRemaining();
                if (current > 1) {
                    this.timeRemaining.set(current - 1);
                } else {
                    this.timeRemaining.set(0);
                    // Time's up - finish the entire quiz
                    this.finishQuiz();
                }
            });
    }

    private stopTimer(): void {
        this.timerSubscription?.next();
        this.timerSubscription?.complete();
    }

    // Helper methods
    getAnswerStatus(index: number): 'correct' | 'wrong' | 'skipped' | 'current' | 'pending' {
        const answer = this.answers()[index];
        if (index === this.currentQuestionIndex() && this.quizState() === 'in-progress') {
            return 'current';
        }
        if (!answer?.selectedOptionId) {
            return answer?.isSkipped ? 'skipped' : 'pending';
        }
        return answer.isCorrect ? 'correct' : 'wrong';
    }

    getOptionClass(optionId: string): string {
        const selected = this.selectedOptionId();
        if (selected === optionId) {
            return 'selected';
        }
        return '';
    }

    getReviewOptionClass(question: QuizQuestion, optionId: string): string {
        const answer = this.answers().find(a => a.questionId === question.id);
        const isCorrect = optionId === question.correctOptionId;
        const isSelected = answer?.selectedOptionId === optionId;

        if (isCorrect) return 'correct';
        if (isSelected && !isCorrect) return 'wrong';
        return '';
    }

    isWrongSelectedOption(
        question: QuizQuestion,
        answer: QuizAnswer | undefined,
        optionId: string,
    ): boolean {
        return answer?.selectedOptionId === optionId && optionId !== question.correctOptionId;
    }

    trackByQuestionId(_index: number, question: QuizQuestion): string {
        return question.id;
    }

    trackByOptionId(_index: number, option: QuizOption): string {
        return option.id;
    }

    trackByLessonId(_index: number, lesson: { id: string }): string {
        return lesson.id;
    }

    goToCertificPage(): void {
        this.router.navigate(['/academy/course', this.courseId, 'certificate']);
    }

    private markCurrentQuizLessonCompleted(onCompletion: () => void): void {
        const currentQuizLessonId = this.resolveCurrentQuizLessonId();
        if (!currentQuizLessonId) {
            onCompletion();
            return;
        }

        this.updateLocalLessonCompletionState(currentQuizLessonId);

        this.academyProgressService
            .markLessonCompleted(currentQuizLessonId, this.courseId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    onCompletion();
                },
                error: () => {
                    onCompletion();
                },
            });
    }

    private markLastPublishedLessonCompletedForQuizStart(): void {
        const lastPublishedLessonId = this.resolveLastPublishedLessonIdBeforeCurrentQuiz();
        if (!lastPublishedLessonId) {
            return;
        }

        const isAlreadyCompleted = this.courseLessons().some((lesson) => {
            return lesson.id === lastPublishedLessonId && lesson.progress.isCompleted;
        }) || this.lessons().some((lesson) => {
            return lesson.id === lastPublishedLessonId && lesson.isCompleted;
        });

        if (isAlreadyCompleted) {
            return;
        }

        this.updateLocalLessonCompletionState(lastPublishedLessonId);
        this.academyProgressService
            .markLessonCompleted(lastPublishedLessonId, this.courseId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => void 0,
                error: () => void 0,
            });
    }

    private resolveLastPublishedLessonIdBeforeCurrentQuiz(): string | null {
        const orderedCourseLessons = [...this.courseLessons()]
            .slice()
            .sort((left, right) => left.order - right.order);

        const dynamicLessonId = this.resolveLastPublishedLessonIdFromOrderedList(
            orderedCourseLessons.map((lesson) => ({ id: lesson.id, type: lesson.type })),
        );
        if (dynamicLessonId) {
            return dynamicLessonId;
        }

        const orderedStaticLessons = this.getStaticLessonsForCourse()
            .slice()
            .sort((left, right) => left.order - right.order);

        return this.resolveLastPublishedLessonIdFromOrderedList(
            orderedStaticLessons.map((lesson) => ({ id: lesson.id, type: lesson.type })),
        );
    }

    private resolveLastPublishedLessonIdFromOrderedList(
        orderedLessons: ReadonlyArray<{ id: string; type: AcademyLesson['type'] }>,
    ): string | null {
        if (orderedLessons.length === 0) {
            return null;
        }

        const currentQuizLessonId = this.resolveCurrentQuizLessonId();
        const nonQuizLessons = orderedLessons.filter((lesson) => this.mapLessonType(lesson.type) !== 'quiz');

        if (!currentQuizLessonId) {
            return nonQuizLessons.at(-1)?.id ?? null;
        }

        const currentQuizIndex = orderedLessons.findIndex((lesson) => {
            return lesson.id === currentQuizLessonId && this.mapLessonType(lesson.type) === 'quiz';
        });

        if (currentQuizIndex > 0) {
            const lessonsBeforeQuiz = orderedLessons
                .slice(0, currentQuizIndex)
                .filter((lesson) => this.mapLessonType(lesson.type) !== 'quiz');
            return lessonsBeforeQuiz.at(-1)?.id ?? null;
        }

        return nonQuizLessons.at(-1)?.id ?? null;
    }

    private updateLocalLessonCompletionState(lessonId: string): void {
        this.courseLessons.update((currentLessons) => {
            return currentLessons.map((lesson) => {
                if (lesson.id !== lessonId) {
                    return lesson;
                }

                return {
                    ...lesson,
                    progress: {
                        ...lesson.progress,
                        isCompleted: true,
                        status: 'completed',
                    },
                };
            });
        });

        this.lessons.update((currentLessons) => {
            return currentLessons.map((lesson) => {
                const resolvedLessonId = lesson.quizLessonId ?? lesson.id;
                if (lesson.id !== lessonId && resolvedLessonId !== lessonId) {
                    return lesson;
                }

                return {
                    ...lesson,
                    isCompleted: true,
                };
            });
        });
    }

    private syncPassedQuizCompletion(): void {
        if (this.hasSyncedPassedQuizCompletion || !this.hasSuccessfulDegree()) {
            return;
        }

        this.hasSyncedPassedQuizCompletion = true;

        const nextQuizLessonId = this.nextQuizLessonId();
        this.markCurrentQuizLessonCompleted(() => {
            if (!nextQuizLessonId) {
                this.academyProgressService.markCourseQuizPassed(this.courseId);
            }
        });
    }

    private updateSidebarQuizCompletionState(completedQuizLessonId: string): void {
        this.lessons.update((currentLessons) => currentLessons.map((lesson) => {
            if (lesson.type !== 'quiz') {
                return lesson;
            }

            const lessonId = lesson.quizLessonId ?? lesson.id;
            if (lessonId !== completedQuizLessonId) {
                return lesson;
            }

            return {
                ...lesson,
                isCompleted: true,
            };
        }));
    }

    private resolveCurrentQuizLessonId(): string | null {
        const routeLessonId = this.lessonId.trim();
        if (routeLessonId.length > 0) {
            return routeLessonId;
        }

        const sidebarQuizLessonId = this.courseQuizLessonId?.trim() ?? '';
        if (sidebarQuizLessonId.length > 0) {
            return sidebarQuizLessonId;
        }

        return this.getOrderedQuizLessonIds()[0] ?? null;
    }

    private resolveNextQuizLessonId(): string | null {
        const orderedQuizLessonIds = this.getOrderedQuizLessonIds();
        if (orderedQuizLessonIds.length <= 1) {
            return null;
        }

        const currentQuizLessonId = this.resolveCurrentQuizLessonId();
        const resolvedCurrentQuizLessonId = currentQuizLessonId && orderedQuizLessonIds.includes(currentQuizLessonId)
            ? currentQuizLessonId
            : orderedQuizLessonIds[0];
        const currentQuizIndex = orderedQuizLessonIds.indexOf(resolvedCurrentQuizLessonId);

        if (currentQuizIndex < 0 || currentQuizIndex >= orderedQuizLessonIds.length - 1) {
            return null;
        }

        return orderedQuizLessonIds[currentQuizIndex + 1] ?? null;
    }

    private getOrderedQuizLessonIds(): string[] {
        const orderedQuizLessonIds = this.courseLessons()
            .filter((lesson) => this.mapLessonType(lesson.type) === 'quiz')
            .sort((a, b) => a.order - b.order)
            .map((lesson) => lesson.id)
            .filter((lessonId) => lessonId.trim().length > 0);

        if (orderedQuizLessonIds.length > 0) {
            return orderedQuizLessonIds;
        }

        return this.getStaticLessonsForCourse()
            .filter((lesson) => lesson.type === 'quiz')
            .sort((a, b) => a.order - b.order)
            .map((lesson) => lesson.id)
            .filter((lessonId) => lessonId.trim().length > 0);
    }

    private mapLessonType(value: unknown): SidebarLessonType {
        if (value === 'quiz') return 'quiz';
        if (value === 'intro') return 'intro';
        if (value === 'audio' || value === 4) return 'audio';
        if (value === 'document' || value === 3) return 'document';
        if (value === 'article' || value === 2) return 'article';
        if (value === 'video' || value === 1) return 'video';
        return 'video';
    }

    private buildQuizAnswerPayload(): QuizAnswerDto[] {
        return this.answers()
            .filter((answer): answer is QuizAnswer & { selectedOptionId: string } =>
                typeof answer.selectedOptionId === 'string' && answer.selectedOptionId.length > 0
            )
            .map((answer) => ({
                questionId: answer.questionId,
                selectedOptionId: answer.selectedOptionId,
            }));
    }

    private syncSidebarQuizLesson(activeQuiz: { title?: string; lessonId?: string } | null): void {
        this.lessons.update((currentLessons) => {
            const quizTitle = this.courseQuizTitle || activeQuiz?.title?.trim() || 'Quiz';
            const resolvedQuizLessonId = this.courseQuizLessonId
                || activeQuiz?.lessonId?.trim()
                || this.lessonId
                || '';
            const quizLessonId = resolvedQuizLessonId.length > 0 && resolvedQuizLessonId !== this.courseId
                ? resolvedQuizLessonId
                : undefined;

            const updatedLessons = currentLessons.map((lesson) => {
                if (lesson.type !== 'quiz') {
                    return lesson;
                }

                return {
                    ...lesson,
                    title: quizTitle,
                    duration: 'Assessment',
                    quizLessonId,
                    isCurrent: true,
                    hasNotification: false,
                };
            });

            const hasQuizLesson = updatedLessons.some((lesson) => lesson.type === 'quiz');
            if (hasQuizLesson) {
                return updatedLessons;
            }

            return [
                ...updatedLessons,
                {
                    id: `${QuizComponent.syntheticQuizLessonPrefix}${quizLessonId ?? this.courseId}`,
                    quizLessonId,
                    title: quizTitle,
                    duration: 'Assessment',
                    type: 'quiz' as const,
                    isCompleted: false,
                    isLocked: false,
                    isCurrent: true,
                    hasNotification: false,
                },
            ];
        });
    }

    private getStaticLessonsForCourse(): AcademyLesson[] {
        return ACADEMY_LESSONS
            .filter((lesson) => lesson.courseId === this.courseId)
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((lesson) => ({ ...lesson }));
    }

    private getStaticPreviousLessonId(): string | null {
        const lessons = ACADEMY_LESSONS
            .filter((lesson) => lesson.courseId === this.courseId)
            .slice()
            .sort((a, b) => a.order - b.order);

        const currentQuizLessonId = this.courseQuizLessonId || this.lessonId;
        const currentIndex = lessons.findIndex((lesson) => lesson.id === currentQuizLessonId);
        const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : lessons.find((lesson) => lesson.type !== 'quiz') ?? null;

        return previousLesson?.id ?? null;
    }

    private mapStaticLessonToSidebarLesson(lesson: AcademyLesson): AcademySidebarLessonItem {
        const lessonType = this.mapLessonType(lesson.type);

        return {
            id: lesson.id,
            quizLessonId: lessonType === 'quiz' ? lesson.id : undefined,
            title: lesson.title,
            duration: lesson.duration,
            type: lessonType,
            isCompleted: false,
            isLocked: false,
            isCurrent: lessonType === 'quiz',
            hasNotification: false,
        };
    }

    private restoreQuizResultFromStorage(questions: readonly QuizQuestion[]): void {
        const storedResult = this.restoredQuizResult;
        if (!storedResult?.completed || questions.length === 0) {
            return;
        }

        const storedAnswersById = new Map(storedResult.answers.map((answer) => [answer.questionId, answer]));
        const storedAnswersByIndex = new Map(
            storedResult.answers
                .filter((answer) => typeof answer.questionIndex === 'number')
                .map((answer) => [answer.questionIndex as number, answer]),
        );

        const restoredAnswers: QuizAnswer[] = questions.map((question, index) => {
            const storedAnswer = storedAnswersById.get(question.id) ?? storedAnswersByIndex.get(index);

            if (!storedAnswer) {
                return {
                    questionId: question.id,
                    selectedOptionId: null,
                    isCorrect: false,
                    isSkipped: false,
                };
            }

            const selectedOptionId = typeof storedAnswer.selectedOptionId === 'string'
                ? storedAnswer.selectedOptionId
                : null;
            const isCorrect = typeof selectedOptionId === 'string' && selectedOptionId === question.correctOptionId;

            return {
                questionId: question.id,
                selectedOptionId,
                isCorrect,
                isSkipped: storedAnswer.isSkipped,
            };
        });

        const hasStoredSelections = restoredAnswers.some(
            (answer) => answer.selectedOptionId !== null || answer.isSkipped,
        );

        if (hasStoredSelections) {
            this.answers.set(restoredAnswers);
        }

        this.quizCompletionTime.set(storedResult.completionTime);
        this.quizState.set('review');

        if (this.hasSuccessfulDegree()) {
            this.syncPassedQuizCompletion();
        }
    }

    private parseStoredQuizResult(raw: string): StoredQuizResult | null {
        try {
            const parsed = JSON.parse(raw) as unknown;
            const record = this.asRecord(parsed);

            if (record?.['completed'] !== true) {
                return null;
            }

            const score = typeof record['score'] === 'number' ? Math.max(0, record['score']) : 0;
            const passed = typeof record['passed'] === 'boolean' ? record['passed'] : false;
            const completionTime = typeof record['completionTime'] === 'number' ? Math.max(0, record['completionTime']) : 0;
            const timestamp = typeof record['timestamp'] === 'string' ? record['timestamp'] : '';
            const questionCount = typeof record['questionCount'] === 'number'
                ? Math.max(0, record['questionCount'])
                : this.quizConfig.totalQuestions;
            const answers = this.normalizeStoredAnswers(record['answers']);

            return {
                completed: true,
                score,
                passed,
                completionTime,
                timestamp,
                questionCount,
                answers,
            };
        } catch {
            return null;
        }
    }

    private normalizeStoredAnswers(value: unknown): StoredQuizAnswer[] {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .map((entry): StoredQuizAnswer | null => {
                const record = this.asRecord(entry);
                if (!record || typeof record['questionId'] !== 'string') {
                    return null;
                }

                const selectedOptionIdValue = record['selectedOptionId'];
                const selectedOptionId = typeof selectedOptionIdValue === 'string' || selectedOptionIdValue === null
                    ? selectedOptionIdValue
                    : null;

                const questionIndex = typeof record['questionIndex'] === 'number'
                    ? record['questionIndex']
                    : undefined;

                const isCorrect = record['isCorrect'] === true;

                const normalized: StoredQuizAnswer = {
                    questionId: record['questionId'],
                    selectedOptionId,
                    isSkipped: record['isSkipped'] === true,
                    ...(typeof questionIndex === 'number' ? { questionIndex } : {}),
                    ...(isCorrect ? { isCorrect: true } : {}),
                };

                return normalized;
            })
            .filter((answer): answer is StoredQuizAnswer => answer !== null);
    }

    private asRecord(value: unknown): Record<string, unknown> | null {
        return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
    }

    private mapApiQuestion(
        question: { id?: string; text?: string },
        options: Array<{ id?: string; text?: string; isCorrect?: boolean }>,
        index: number,
    ): QuizQuestion {
        const questionFallbackId = question.id ?? `question-${index + 1}`;
        const mappedOptions = options.map((option, optionIndex) => ({
            id: String(option.id ?? `${questionFallbackId}-option-${optionIndex + 1}`),
            label: QuizComponent.optionLabels[optionIndex] ?? String(optionIndex + 1),
            text: String(option.text ?? ''),
        }));

        const correctOption = options.find(option => option.isCorrect === true);
        const correctOptionId = String(correctOption?.id ?? mappedOptions[0]?.id ?? '');

        return {
            id: String(question.id ?? `question-${index + 1}`),
            questionNumber: index + QuizComponent.questionNumberOffset,
            questionText: String(question.text ?? 'Untitled question'),
            options: mappedOptions,
            correctOptionId,
        };
    }

    retakeQuizFromResults(): void {
        const storageKey = `quiz_${this.courseId}_${this.lessonId}`;
        if (this.isBrowser) {
            localStorage.removeItem(storageKey);
        }

        this.restoredQuizResult = null;

        // Reset state
        this.previousScore.set(0);
        this.previousCompletionTime.set(0);
        this.wasPreviouslyPassed.set(false);
        this.quizCompletionTime.set(0);
        this.resetAnswersToDefault();
        this.activeAttemptId.set(null);
        this.isFinishingQuiz = false;
        this.hasSyncedPassedQuizCompletion = false;
        this.currentQuestionIndex.set(0);
        this.selectedOptionId.set(null);
        this.showHint.set(false);

        // Start fresh quiz
        this.quizState.set('intro');
        this.scrollService.scrollToTop();
    }
}

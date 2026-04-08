import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, forkJoin, interval, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { OptionsService } from '../../../core/services/options.service';
import { QuizAttemptsService } from '../../../core/services/quiz-attempts.service';
import { QuizAnswerDto } from '../../../api/models/quiz-answer-dto';
import {
    AcademyBreadcrumbItem,
    AcademyPageShellComponent,
} from '../shared/academy-page-shell/academy-page-shell.component';
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

interface QuizAnswer {
    readonly questionId: string;
    readonly selectedOptionId: string | null;
    readonly isCorrect: boolean;
    readonly isSkipped: boolean;
}

type QuizState = 'intro' | 'in-progress' | 'review' | 'completed' | 'results';

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
    // Route params
    courseId = '';
    lessonId = '';

    readonly bannerImageUrl = '/backgrounds/course-background.png';
    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    // Course info
    readonly courseInfo = signal({
        stage: 1,
        code: 'A2',
        title: 'Prayer (Salah)',
        totalLessons: 5,
        currentLesson: 5,
        duration: '4h 10m'
    });

    // Quiz configuration
    readonly quizConfig = {
        totalQuestions: 10,
        timePerQuestion: 600, // seconds (10 minutes - exact Figma requirement)
        passingScore: 8
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

    readonly correctAnswersCount = computed(() =>
        this.answers().filter(a => a.isCorrect).length
    );

    readonly wrongAnswersCount = computed(() =>
        this.answers().filter(a => !a.isCorrect && !a.isSkipped).length
    );

    readonly skippedCount = computed(() =>
        this.answers().filter(a => a.isSkipped).length
    );

    readonly scorePercentage = computed(() => {
        const total = this.questions().length;
        if (total === 0) return 0;
        return Math.round((this.correctAnswersCount() / total) * 100);
    });

    readonly hasPassed = computed(() =>
        this.correctAnswersCount() >= this.quizConfig.passingScore
    );

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
    readonly lessons = signal<Array<{
        id: string;
        quizLessonId?: string;
        title: string;
        duration: string;
        type: 'intro' | 'video' | 'article' | 'quiz' | 'audio';
        isCompleted: boolean;
        isLocked?: boolean;
        isCurrent?: boolean;
        hasNotification?: boolean;
    }>>([]);

    // Passed/Completed state
    readonly userRating = signal<number>(0);
    readonly userFeedback = signal<string>('');
    readonly nextCourseName = signal<string>('Prophet Mohamed\'s Journey');

    private readonly destroy$ = new Subject<void>();
    private timerSubscription?: Subject<void>;
    private isFinishingQuiz = false;
    private readonly isBrowser: boolean;

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
        return [
            ...this.breadcrumbsBase,
            {
                label: `Course ${this.courseInfo().code}: ${this.courseInfo().title}`,
                link: ['/academy/course', this.courseId],
            },
        ];
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
        this.quizStartTime = 0;

        this.quizState.set('intro');
        this.currentQuestionIndex.set(0);
        this.timeRemaining.set(this.quizConfig.timePerQuestion);
        this.showHint.set(false);
        this.selectedOptionId.set(null);

        this.activeQuizId.set(null);
        this.activeAttemptId.set(null);
        this.questions.set([]);
        this.answers.set([]);

        this.quizCompletionTime.set(0);
    }

    private checkPreviousCompletion(): void {
        // Only access localStorage in browser environment
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        // Check localStorage for previous quiz completion
        const storageKey = `quiz_${this.courseId}_${this.lessonId}`;
        const storedData = localStorage.getItem(storageKey);

        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                if (data.completed && data.score !== undefined) {
                    this.previousScore.set(data.score);
                    this.previousCompletionTime.set(data.completionTime || 0);
                    this.wasPreviouslyPassed.set(data.passed || false);
                    this.quizState.set('results');
                }
            } catch {
                this.previousScore.set(0);
                this.previousCompletionTime.set(0);
                this.wasPreviouslyPassed.set(false);
            }
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.stopTimer();
    }

    private loadCourseInfo(): void {
        if (!this.courseId) return;

        // Load course info from academy progress service
        const course = this.academyProgressService.getCourseById(this.courseId);
        if (course) {
            this.courseInfo.set({
                stage: course.stageId,
                code: course.id.split('-')[1]?.toUpperCase() || 'A2',
                title: course.title,
                totalLessons: course.lessons,
                currentLesson: course.lessons,
                duration: course.duration
            });
        }

        this.academyProgressService.getCourseLessonsWithProgress(this.courseId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (lessons) => {
                    this.lessons.set(lessons.map((lesson) => {
                        const lessonType = this.mapLessonType(lesson.type);
                        return {
                            id: lesson.id,
                            quizLessonId: lessonType === 'quiz' ? lesson.id : undefined,
                            title: lesson.title,
                            duration: lessonType === 'quiz' ? 'Assessment' : lesson.duration,
                            type: lessonType,
                            isCompleted: lesson.progress.status === 'completed',
                            isLocked: lesson.progress.status === 'locked',
                            isCurrent: lesson.progress.status === 'current',
                            hasNotification: lesson.progress.status === 'current'
                        };
                    }));
                },
                error: () => { }
            });
    }

    private loadQuizData(): void {
        const query = this.lessonId
            ? { lessonId: this.lessonId, pageSize: 50 }
            : { courseId: this.courseId, pageSize: 50 };

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

                            return this.quizzesService.getAll({ lessonId: quizLessonId, pageSize: 50 });
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
            });
    }

    private buildQuestionsFromQuizId(quizId: string): Observable<QuizQuestion[]> {
        return this.questionsService.getAllByQuizId(quizId).pipe(
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

    // Quiz Actions
    startQuiz(): void {
        if (this.questions().length === 0) {
            return;
        }
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
        const quizData = {
            completed: true,
            score: this.correctAnswersCount(),
            passed: this.hasPassed(),
            completionTime: this.quizCompletionTime(),
            timestamp: new Date().toISOString()
        };
        if (this.isBrowser) {
            localStorage.setItem(storageKey, JSON.stringify(quizData));
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
        // Reset all answers
        const resetAnswers = this.answers().map(a => ({
            ...a,
            selectedOptionId: null,
            isCorrect: false,
            isSkipped: false
        }));
        this.answers.set(resetAnswers);
        this.activeAttemptId.set(null);
        this.isFinishingQuiz = false;
        // Scroll to top when starting to retake quiz
        this.scrollService.scrollToTop();
        this.startQuiz();
    }

    completeQuiz(): void {
        if (this.hasPassed()) {
            this.quizState.set('completed');
        } else {
            this.retakeQuiz();
        }
    }

    goToNextCourse(): void {
        // Navigate to next course
        this.router.navigate(['/academy']);
    }

    goToPreviousLesson(): void {
        // Navigate back to the course page
        this.router.navigate(['/academy/course', this.courseId]);
    }

    setRating(rating: number): void {
        this.userRating.set(rating);
    }

    updateFeedback(value: string): void {
        this.userFeedback.set(value);
    }

    submitFeedback(): void {
        const feedback = this.userFeedback();
        const rating = this.userRating();

        // Send feedback and rating to backend via API service
        if (rating > 0 || feedback.trim().length > 0) {
            // Feedback submission would be integrated with backend API
            // placeholder for future implementation
        }

        // Clear the feedback
        this.userFeedback.set('');
        this.userRating.set(0);
    }

    // Timer methods
    private startTimer(): void {
        this.timerSubscription = new Subject<void>();
        this.timeRemaining.set(this.quizConfig.timePerQuestion);

        interval(1000)
            .pipe(takeUntil(this.timerSubscription), takeUntil(this.destroy$))
            .subscribe(() => {
                const current = this.timeRemaining();
                if (current > 0) {
                    this.timeRemaining.set(current - 1);
                } else {
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
    private mapLessonType(value: unknown): 'intro' | 'video' | 'article' | 'quiz' | 'audio' {
        if (value === 'quiz') return 'quiz';
        if (value === 'intro') return 'intro';
        if (value === 'audio' || value === 4) return 'audio';
        if (value === 'article' || value === 2 || value === 3) return 'article';
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
            const quizTitle = activeQuiz?.title?.trim() || 'Quiz';
            const quizLessonId = activeQuiz?.lessonId?.trim() || this.lessonId || this.courseId;

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
            if (hasQuizLesson || !activeQuiz) {
                return updatedLessons;
            }

            return [
                ...updatedLessons,
                {
                    id: `${QuizComponent.syntheticQuizLessonPrefix}${quizLessonId}`,
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

        // Reset state
        this.previousScore.set(0);
        this.previousCompletionTime.set(0);
        this.wasPreviouslyPassed.set(false);

        // Start fresh quiz
        this.quizState.set('intro');
    }
}

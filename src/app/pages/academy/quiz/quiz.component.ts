/* eslint-disable deprecation/deprecation */
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QuizAttemptsService } from '../../../core/services/quiz-attempts.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { AcademyMockDataService } from '../../../core/services/mock-data/academy-mock-data.service';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { LessonMetadata } from '../../../core/models/interfaces/lesson-content.model';
import {
    AcademyBreadcrumbItem,
    AcademyPageShellComponent,
} from '../shared/academy-page-shell/academy-page-shell.component';
import { asRecord, extractArray, getValue, toStringValue } from '../../../core/helpers/api-response.helper';

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
    imports: [FormsModule, AcademyPageShellComponent],
    templateUrl: './quiz.component.html',
    styleUrls: ['./quiz.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent implements OnInit, OnDestroy {
    private static readonly optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    private static readonly questionNumberOffset = 1;
    private static readonly defaultStudentId = '1';
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
    readonly lessons = signal([
        { id: 'intro', title: 'Intro', duration: '3 min', type: 'intro', isCompleted: true, hasNotification: false },
        { id: 'lesson-1', title: 'Introduction To Fiqh', duration: '3 min', type: 'video', isCompleted: true, hasNotification: true },
        { id: 'lesson-2', title: 'How To Pray - Part 1', duration: '3 min', type: 'video', isCompleted: true, hasNotification: false },
        { id: 'lesson-3', title: 'How To Pray - Part 2', duration: '3 min', type: 'video', isCompleted: true, hasNotification: false },
        { id: 'lesson-4', title: 'How To Pray - Part 3', duration: '3 min', type: 'video', isCompleted: true, hasNotification: false },
        { id: 'lesson-5', title: 'How To Pray - Part 4', duration: '3 min', type: 'video', isCompleted: true, hasNotification: false },
        { id: 'quiz', title: 'Quiz', duration: '3 min', type: 'quiz', isCompleted: false, isCurrent: true, hasNotification: false },
    ]);

    // Passed/Completed state
    readonly userRating = signal<number>(0);
    readonly userFeedback = signal<string>('');
    readonly nextCourseName = signal<string>('Prophet Mohamed\'s Journey');

    private readonly destroy$ = new Subject<void>();
    private timerSubscription?: Subject<void>;
    private currentQuizId = '';
    private currentAttemptId: string = '';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly quizAttemptsService: QuizAttemptsService,
        private readonly questionsService: QuestionsService,
        private readonly mockDataService: AcademyMockDataService,
        private readonly academyProgressService: AcademyProgressService,
        private readonly scrollService: ScrollService,
        @Inject(PLATFORM_ID) private readonly platformId: object
    ) { }

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
            this.currentQuizId = this.courseId;
            this.loadCourseInfo();
            this.loadQuizData();
            this.checkPreviousCompletion();
        });
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

        this.mockDataService.getCourseLessonsMetadata(this.courseId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (lessons: LessonMetadata[]) => {
                    this.lessons.set(lessons.map((lesson) => {
                        const lessonType = this.mapLessonType(lesson.type);
                        return {
                            id: lesson.id,
                            title: lesson.title,
                            duration: lesson.duration,
                            type: lessonType,
                            isCompleted: lesson.status === 'completed',
                            isCurrent: lesson.status === 'current',
                            hasNotification: lesson.hasFeedback === true
                        };
                    }));
                },
                error: () => { }
            });
    }

    private loadQuizData(): void {
        if (!this.courseId) {
            this.loadMockQuizData();
            return;
        }

        this.questionsService.getAll()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const mappedQuestions = this.mapApiQuestions(response);
                    if (mappedQuestions.length > 0) {
                        this.questions.set(mappedQuestions);
                        this.initializeAnswers(mappedQuestions);
                        return;
                    }
                    this.loadMockQuizData();
                },
                error: () => this.loadMockQuizData()
            });
    }

    private loadMockQuizData(): void {
        const mockQuestions: QuizQuestion[] = Array.from({ length: 10 }, (_, i) => ({
            id: `q${i + 1}`,
            questionNumber: i + 1,
            questionText: 'The term "Tawhid" is a fundamental concept in Islam. What does it mean?',
            options: [
                { id: 'a', label: 'A', text: 'The belief in multiple gods' },
                { id: 'b', label: 'B', text: 'The oneness of Allah (God)' },
                { id: 'c', label: 'C', text: 'The practice of fasting' },
                { id: 'd', label: 'D', text: 'The pilgrimage to Mecca' }
            ],
            correctOptionId: 'b',
            hint: 'Tawhid comes from the Arabic root "wahada" which means to make one.',
            evidenceSource: 'google.translate.mon'
        }));

        this.questions.set(mockQuestions);
        this.initializeAnswers(mockQuestions);
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
        this.quizState.set('in-progress');
        this.currentQuestionIndex.set(0);
        this.selectedOptionId.set(null);
        this.showHint.set(false);
        this.quizStartTime = Date.now();
        // Scroll to top when starting quiz
        this.scrollService.scrollToTop();
        // Timer starts with quiz - 10 minutes total for entire quiz
        this.startTimer();

        if (this.currentQuizId) {
            this.quizAttemptsService
                .create({ quizId: this.currentQuizId, studentId: QuizComponent.defaultStudentId })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (attempt) => {
                        this.currentAttemptId = this.extractAttemptId(attempt);
                    },
                    error: () => {
                        this.currentAttemptId = '';
                    },
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
        localStorage.setItem(storageKey, JSON.stringify(quizData));

        if (this.currentAttemptId) {
            const score = this.correctAnswersCount();
            const isPassed = this.hasPassed();

            this.quizAttemptsService.complete(this.currentAttemptId, { score, isPassed })
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => { },
                    error: () => { }
                });
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
    private mapApiQuestions(response: unknown): QuizQuestion[] {
        const records = extractArray(response);
        const filtered = this.filterQuestionsByCourse(records, this.courseId);
        return filtered.map((item, index) => this.mapApiQuestion(item, index));
    }

    private mapApiQuestion(item: unknown, index: number): QuizQuestion {
        const record = asRecord(item);
        const id = toStringValue(getValue(record, 'id', 'Id')) ?? `question-${index + QuizComponent.questionNumberOffset}`;
        const questionText = toStringValue(getValue(record, 'questionText', 'QuestionText', 'text', 'Text')) ??
            'Question';
        const options = this.mapOptions(getValue(record, 'options', 'Options'));
        const hint = toStringValue(getValue(record, 'hint', 'Hint')) ?? undefined;
        const evidenceSource = toStringValue(getValue(record, 'evidenceSource', 'EvidenceSource')) ?? undefined;
        const correctOptionId = toStringValue(getValue(record, 'correctOptionId', 'CorrectOptionId')) ?? (options[0]?.id ?? '');

        return {
            id,
            questionNumber: index + QuizComponent.questionNumberOffset,
            questionText,
            options,
            correctOptionId,
            hint,
            evidenceSource,
        };
    }

    private mapOptions(value: unknown): QuizOption[] {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.map((option, index) => {
            const record = asRecord(option);
            const id = toStringValue(getValue(record, 'id', 'Id')) ?? `option-${index + QuizComponent.questionNumberOffset}`;
            const text = toStringValue(getValue(record, 'text', 'Text')) ?? 'Answer';
            const label = toStringValue(getValue(record, 'label', 'Label')) ??
                QuizComponent.optionLabels[index] ?? `${index + QuizComponent.questionNumberOffset}`;
            return { id, text, label };
        });
    }

    private filterQuestionsByCourse(records: readonly unknown[], courseId: string): readonly unknown[] {
        if (!courseId) return records;
        return records.filter((item) => {
            const record = asRecord(item);
            const quizId = toStringValue(getValue(record, 'quizId', 'QuizId'));
            const mappedCourseId = toStringValue(getValue(record, 'courseId', 'CourseId'));
            return quizId === courseId || mappedCourseId === courseId;
        });
    }

    private mapLessonType(value: unknown): 'intro' | 'video' | 'article' | 'quiz' | 'audio' {
        if (value === 'quiz' || value === 4) return 'quiz';
        if (value === 'article' || value === 3) return 'article';
        if (value === 'audio') return 'audio';
        if (value === 'intro') return 'intro';
        return 'video';
    }

    private extractAttemptId(value: unknown): string {
        const record = asRecord(value);
        return toStringValue(getValue(record, 'id', 'Id')) ?? '';
    }

    retakeQuizFromResults(): void {
        const storageKey = `quiz_${this.courseId}_${this.lessonId}`;
        localStorage.removeItem(storageKey);

        // Reset state
        this.previousScore.set(0);
        this.previousCompletionTime.set(0);
        this.wasPreviouslyPassed.set(false);

        // Start fresh quiz
        this.quizState.set('intro');
    }
}

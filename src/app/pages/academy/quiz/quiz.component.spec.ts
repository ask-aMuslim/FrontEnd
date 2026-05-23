/* eslint-disable no-undef */
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { OptionsService } from '../../../core/services/options.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { QuizAttemptsService } from '../../../core/services/quiz-attempts.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { ScrollService } from '../../../core/services/scroll.service';
import { LessonProgress } from '../../../core/models/interfaces/academy-progress.model';
import { QuizComponent } from './quiz.component';

describe('QuizComponent', () => {
    let component: QuizComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let academyProgressServiceSpy: jasmine.SpyObj<AcademyProgressService>;
    let quizAttemptsServiceSpy: jasmine.SpyObj<QuizAttemptsService>;
    let scrollServiceSpy: { scrollToTop: jasmine.Spy };

    const buildQuestions = (count: number): Array<Record<string, unknown>> => {
        return Array.from({ length: count }, (_value, index) => ({
            id: `question-${index + 1}`,
            questionNumber: index + 1,
            questionText: `Question ${index + 1}`,
            options: [],
            correctOptionId: 'a',
        }));
    };

    const buildAnswers = (count: number, correctCount: number): Array<Record<string, unknown>> => {
        return Array.from({ length: count }, (_value, index) => ({
            questionId: `question-${index + 1}`,
            selectedOptionId: index < correctCount ? 'a' : 'b',
            isCorrect: index < correctCount,
            isSkipped: false,
        }));
    };

    const createCourseLesson = (
        id: string,
        order: number,
        type: 'video' | 'quiz' | 'article' = 'quiz',
        isCompleted = false,
    ): Record<string, unknown> => ({
        id,
        courseId: 'course-1',
        title: `Lesson ${order}`,
        description: `Lesson ${order} description`,
        type,
        duration: '10 min',
        order,
        progress: {
            lessonId: id,
            courseId: 'course-1',
            status: isCompleted ? 'completed' : 'available',
            isCompleted,
            completedAt: null,
            completedDate: null,
            viewCount: 0,
            lastViewedAt: null,
        },
    });

    beforeEach(() => {
        localStorage.clear();

        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        academyProgressServiceSpy = jasmine.createSpyObj<AcademyProgressService>(
            'AcademyProgressService',
            ['markLessonCompleted', 'markCourseQuizPassed'],
        );
        academyProgressServiceSpy.markLessonCompleted.and.returnValue(of({} as LessonProgress));
        academyProgressServiceSpy.markCourseQuizPassed.and.stub();

        quizAttemptsServiceSpy = jasmine.createSpyObj<QuizAttemptsService>(
            'QuizAttemptsService',
            ['startAttemptForQuiz'],
        );
        quizAttemptsServiceSpy.startAttemptForQuiz.and.returnValue(of({} as never));

        scrollServiceSpy = {
            scrollToTop: jasmine.createSpy('scrollToTop'),
        };

        component = new QuizComponent(
            {} as ActivatedRoute,
            routerSpy,
            {} as QuizzesService,
            {} as QuestionsService,
            {} as OptionsService,
            quizAttemptsServiceSpy,
            academyProgressServiceSpy,
            scrollServiceSpy as unknown as ScrollService,
            'browser' as never,
        );

        component.courseId = 'course-1';
        component.lessonId = 'quiz-1';
        component.questions.set(buildQuestions(10) as never[]);
        component.answers.set(buildAnswers(10, 8) as never[]);
        (component as unknown as { quizStartTime: number }).quizStartTime = Date.now() - 60_000;
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('marks the current quiz lesson completed when a passed quiz finishes', () => {
        component.courseLessons.set([
            createCourseLesson('quiz-1', 1),
            createCourseLesson('quiz-2', 2),
        ] as never[]);

        (component as unknown as { finishQuiz: () => void }).finishQuiz();

        expect(component['quizState']()).toBe('review');
        expect(academyProgressServiceSpy.markLessonCompleted).toHaveBeenCalledWith('quiz-1', 'course-1');
        expect(academyProgressServiceSpy.markCourseQuizPassed).not.toHaveBeenCalled();
        expect(component.courseLessons()[0].progress.isCompleted).toBeTrue();
        expect(component.courseLessons()[0].progress.status).toBe('completed');
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('marks the course quiz passed on the final passed quiz', () => {
        component.courseLessons.set([
            createCourseLesson('quiz-1', 1),
        ] as never[]);

        (component as unknown as { finishQuiz: () => void }).finishQuiz();

        expect(component['quizState']()).toBe('review');
        expect(academyProgressServiceSpy.markLessonCompleted).toHaveBeenCalledWith('quiz-1', 'course-1');
        expect(academyProgressServiceSpy.markCourseQuizPassed).toHaveBeenCalledWith('course-1');
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('marks the last published non-quiz lesson completed when the user starts the quiz', () => {
        component.courseLessons.set([
            createCourseLesson('lesson-1', 1, 'video'),
            createCourseLesson('quiz-1', 2, 'quiz'),
        ] as never[]);

        component.startQuiz();

        expect(academyProgressServiceSpy.markLessonCompleted).toHaveBeenCalledWith('lesson-1', 'course-1');
        expect(component.courseLessons()[0].progress.isCompleted).toBeTrue();
    });

    it('treats a restored successful degree as passed and syncs quiz completion', () => {
        component.courseLessons.set([
            createCourseLesson('quiz-1', 1),
        ] as never[]);

        const unansweredAnswers = Array.from({ length: 10 }, (_value, index) => ({
            questionId: `question-${index + 1}`,
            selectedOptionId: null,
            isCorrect: false,
            isSkipped: false,
        }));
        component.answers.set(unansweredAnswers as never[]);

        (component as unknown as {
            restoredQuizResult: {
                completed: boolean;
                score: number;
                passed: boolean;
                completionTime: number;
                timestamp: string;
                questionCount: number;
                answers: Array<unknown>;
            };
        }).restoredQuizResult = {
            completed: true,
            score: 7,
            passed: true,
            completionTime: 30,
            timestamp: new Date().toISOString(),
            questionCount: 10,
            answers: [],
        };

        component.quizState.set('results');
        (component as unknown as { syncPassedQuizCompletion: () => void }).syncPassedQuizCompletion();

        expect(component['hasSuccessfulDegree']()).toBeTrue();
        expect(academyProgressServiceSpy.markLessonCompleted).toHaveBeenCalledWith('quiz-1', 'course-1');
        expect(academyProgressServiceSpy.markCourseQuizPassed).toHaveBeenCalledWith('course-1');
    });

    it('keeps success degree true when restored successful result has answered selections', () => {
        const mixedAnswers = Array.from({ length: 10 }, (_value, index) => ({
            questionId: `question-${index + 1}`,
            selectedOptionId: index < 4 ? 'a' : 'b',
            isCorrect: index < 4,
            isSkipped: false,
        }));
        component.answers.set(mixedAnswers as never[]);

        (component as unknown as {
            restoredQuizResult: {
                completed: boolean;
                score: number;
                passed: boolean;
                completionTime: number;
                timestamp: string;
                questionCount: number;
                answers: Array<unknown>;
            };
        }).restoredQuizResult = {
            completed: true,
            score: 4,
            passed: true,
            completionTime: 25,
            timestamp: new Date().toISOString(),
            questionCount: 10,
            answers: [],
        };

        component.quizState.set('results');

        expect(component['hasSuccessfulDegree']()).toBeTrue();
    });
});

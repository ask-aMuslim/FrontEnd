import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { combineLatest, forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { OptionsService } from '../../../core/services/options.service';
import { AuthService } from '../../../core/services/auth.service';
import { ACADEMY_COURSES } from '../../../core/services/academy-data';
import {
    AcademyCourse,
    AcademyLesson,
    LessonProgress,
} from '../../../core/models/interfaces/academy-progress.model';
import { QuizReadDto } from '../../../api/facades/quiz.facade';

export interface QuizOption {
    readonly id: string;
    readonly label: string;
    readonly text: string;
}

export interface QuizQuestion {
    readonly id: string;
    readonly questionNumber: number;
    readonly questionText: string;
    readonly options: readonly QuizOption[];
    readonly correctOptionId: string;
    readonly hint?: string;
    readonly evidenceSource?: string;
}

export interface QuizResolvedData {
    course: AcademyCourse;
    lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[];
    quizzes: QuizReadDto[];
    activeQuiz: QuizReadDto | null;
    questions: QuizQuestion[];
}

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
const questionNumberOffset = 1;

function mapApiQuestion(
    question: { id?: string; text?: string },
    options: Array<{ id?: string; text?: string; isCorrect?: boolean }>,
    index: number,
): QuizQuestion {
    const questionFallbackId = question.id ?? `question-${index + 1}`;
    const mappedOptions = options.map((option, optionIndex) => ({
        id: String(option.id ?? `${questionFallbackId}-option-${optionIndex + 1}`),
        label: optionLabels[optionIndex] ?? String(optionIndex + 1),
        text: String(option.text ?? ''),
    }));

    const correctOption = options.find(option => option.isCorrect === true);
    const correctOptionId = String(correctOption?.id ?? mappedOptions[0]?.id ?? '');

    return {
        id: String(question.id ?? `question-${index + 1}`),
        questionNumber: index + questionNumberOffset,
        questionText: String(question.text ?? 'Untitled question'),
        options: mappedOptions,
        correctOptionId,
    };
}

export const quizResolver: ResolveFn<QuizResolvedData | null> = (route) => {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) {
        return of(null);
    }

    const courseId = route.paramMap.get('courseId') || '';
    const lessonId = route.paramMap.get('lessonId') || '';

    if (!courseId) {
        return of(null);
    }

    const academyProgressService = inject(AcademyProgressService);
    const quizzesService = inject(QuizzesService);
    const questionsService = inject(QuestionsService);
    const optionsService = inject(OptionsService);
    const authService = inject(AuthService);

    if (!authService.isAuthenticated()) {
        return of(null);
    }

    return academyProgressService.getAcademyCourseById(courseId).pipe(
        take(1),
        switchMap((courseInfo) => {
            const resolvedCourse = courseInfo ?? ACADEMY_COURSES.find((item) => item.id === courseId);
            if (!resolvedCourse) {
                return of(null);
            }

            return combineLatest([
                of(resolvedCourse),
                academyProgressService.getCourseLessonsWithProgress(courseId).pipe(take(1), catchError(() => of([]))),
                quizzesService.getAll({ courseId, pageSize: 200 }).pipe(take(1), catchError(() => of([]))),
            ]).pipe(
                switchMap(([course, lessonsWithProgress, quizzes]) => {
                    const query = lessonId
                        ? { lessonId: lessonId, pageNumber: 1, pageSize: 200 }
                        : { courseId: courseId, pageNumber: 1, pageSize: 200 };

                    return quizzesService.getAll(query).pipe(
                        take(1),
                        switchMap((routeQuizzes) => {
                            const hasQuizzes = routeQuizzes.length > 0;
                            const canFallbackToQuizLesson = !hasQuizzes && !lessonId && !!courseId;

                            if (!canFallbackToQuizLesson) {
                                return of(routeQuizzes);
                            }

                            return academyProgressService.getAcademyLessons(courseId).pipe(
                                take(1),
                                map((lessons) => lessons.find((l) => l.type === 'quiz')?.id ?? null),
                                switchMap((quizLessonId) => {
                                    if (!quizLessonId) {
                                        return of(routeQuizzes);
                                    }

                                    return quizzesService.getAll({ lessonId: quizLessonId, pageNumber: 1, pageSize: 200 }).pipe(take(1));
                                }),
                                catchError(() => of(routeQuizzes)),
                            );
                        }),
                        switchMap((finalQuizzes) => {
                            const activeQuiz = finalQuizzes[0] ?? null;
                            if (!activeQuiz?.id) {
                                return of<QuizResolvedData>({
                                    course,
                                    lessonsWithProgress,
                                    quizzes,
                                    activeQuiz: null,
                                    questions: [],
                                });
                            }

                            return questionsService.getAllByQuizId(activeQuiz.id, {
                                pageNumber: 1,
                                pageSize: 1000,
                            }).pipe(
                                take(1),
                                switchMap((questions) => {
                                    if (!questions.length) {
                                        return of<QuizResolvedData>({
                                            course,
                                            lessonsWithProgress,
                                            quizzes,
                                            activeQuiz,
                                            questions: [],
                                        });
                                    }

                                    const questionWithOptionsObservables = questions.map((question, index) => {
                                        return optionsService.getByQuestion(String(question.id ?? '')).pipe(
                                            take(1),
                                            map((options) => mapApiQuestion(question, options, index)),
                                            catchError(() => of(mapApiQuestion(question, [], index)))
                                        );
                                    });

                                    return forkJoin(questionWithOptionsObservables).pipe(
                                        map((questionsWithOptions) => ({
                                            course,
                                            lessonsWithProgress,
                                            quizzes,
                                            activeQuiz,
                                            questions: questionsWithOptions,
                                        }))
                                    );
                                }),
                                catchError(() => of<QuizResolvedData>({
                                    course,
                                    lessonsWithProgress,
                                    quizzes,
                                    activeQuiz,
                                    questions: [],
                                }))
                            );
                        }),
                        catchError(() => of<QuizResolvedData>({
                            course,
                            lessonsWithProgress,
                            quizzes,
                            activeQuiz: null,
                            questions: [],
                        }))
                    );
                })
            );
        }),
        catchError(() => of(null))
    );
};

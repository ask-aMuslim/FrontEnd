import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { combineLatest, forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { OptionsService } from '../../../core/services/options.service';
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

function resolveRouteQuizzes(
    academyProgressService: AcademyProgressService,
    quizzesService: QuizzesService,
    courseId: string,
    lessonId: string,
    cachedQuizzes: QuizReadDto[],
): Observable<QuizReadDto[]> {
    if (cachedQuizzes && cachedQuizzes.length > 0) {
        if (lessonId) {
            const matched = cachedQuizzes.filter(q => q.lessonId === lessonId);
            if (matched.length > 0) {
                return of(matched);
            }
        } else {
            return of(cachedQuizzes);
        }
    }

    const query = lessonId
        ? { lessonId, pageNumber: 1, pageSize: 200 }
        : { courseId, pageNumber: 1, pageSize: 200 };

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
    );
}

function resolveQuizQuestions(
    course: AcademyCourse,
    lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[],
    quizzes: QuizReadDto[],
    activeQuiz: QuizReadDto,
    questionsService: QuestionsService,
    optionsService: OptionsService,
): Observable<QuizResolvedData> {
    const activeQuizId = String(activeQuiz.id ?? '');
    if (!activeQuizId) {
        return of<QuizResolvedData>({
            course,
            lessonsWithProgress,
            quizzes,
            activeQuiz,
            questions: [],
        });
    }

    return questionsService.getAllByQuizId(activeQuizId, {
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

            const questionWithOptionsObservables = questions.map((question, index) =>
                optionsService.getByQuestion(String(question.id ?? '')).pipe(
                    take(1),
                    map((options) => mapApiQuestion(question, options, index)),
                    catchError(() => of(mapApiQuestion(question, [], index))),
                ),
            );

            return forkJoin(questionWithOptionsObservables).pipe(
                map((questionsWithOptions) => ({
                    course,
                    lessonsWithProgress,
                    quizzes,
                    activeQuiz,
                    questions: questionsWithOptions,
                })),
            );
        }),
        catchError(() => of<QuizResolvedData>({
            course,
            lessonsWithProgress,
            quizzes,
            activeQuiz,
            questions: [],
        })),
    );
}

function buildQuizResolvedData(
    course: AcademyCourse,
    lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[],
    quizzes: QuizReadDto[],
    routeQuizzes: QuizReadDto[],
    questionsService: QuestionsService,
    optionsService: OptionsService,
): Observable<QuizResolvedData> {
    const activeQuiz = routeQuizzes[0] ?? null;
    if (!activeQuiz?.id) {
        return of({
            course,
            lessonsWithProgress,
            quizzes,
            activeQuiz: null,
            questions: [],
        });
    }

    return resolveQuizQuestions(course, lessonsWithProgress, quizzes, activeQuiz, questionsService, optionsService);
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

    return combineLatest([
        academyProgressService.getCourseByIdDirect(courseId).pipe(take(1)),
        academyProgressService.getCourseQuizzesDirect(courseId).pipe(take(1)),
    ]).pipe(
        take(1),
        switchMap(([rawCourse, quizzes]) => {
            if (!rawCourse) {
                return of(null);
            }

            // Map AcademyCourse
            const category = (rawCourse.category as any) || 'social-topics';
            const course: AcademyCourse = {
                id: rawCourse.id ?? '',
                stageId: 1,
                levelId: rawCourse.levelId ?? '',
                title: rawCourse.title ?? 'Untitled Course',
                category,
                categoryLabel: rawCourse.category ? String(rawCourse.category).toUpperCase() : 'Social Topics',
                lessons: Array.isArray(rawCourse.lessons) ? rawCourse.lessons.length : 0,
                duration: '0m',
                thumbnailUrl: rawCourse.thumbnailUrl,
                description: rawCourse.description,
                stageLabel: (rawCourse['levelName'] as string) ?? (rawCourse['levelname'] as string) ?? (rawCourse['level_name'] as string) ?? rawCourse.level ?? 'Course',
            };

            // Map lessonsWithProgress
            const rawLessons = Array.isArray(rawCourse.lessons) ? rawCourse.lessons : [];
            const parseLessonType = (raw: unknown): 'intro' | 'video' | 'article' | 'document' | 'quiz' | 'audio' => {
                const str = String(raw ?? '').toLowerCase();
                if (str === '1' || str === 'video') return 'video';
                if (str === '2' || str === 'article') return 'article';
                if (str === '3' || str === 'document') return 'document';
                if (str === '4' || str === 'audio') return 'audio';
                if (str === '5' || str === 'quiz') return 'quiz';
                return 'intro';
            };

            const lessonsWithProgress = rawLessons
                .filter((l: any) => l.isPublished !== false)
                .map((l: any, index: number) => {
                    const lId = l.lessonId ?? l.id ?? '';
                    const lessonType = parseLessonType(l.lessonType ?? l.type);
                    const isCompleted = !!(l.isLessonCompleted ?? l.isCompleted);

                    const academyLesson: AcademyLesson = {
                        id: lId,
                        courseId: courseId,
                        title: l.lessonName ?? l.title ?? '',
                        duration: academyProgressService.resolveLessonDurationFromDto(l, lessonType),
                        type: lessonType,
                        order: index + 1,
                    };

                    const progress: LessonProgress = {
                        lessonId: lId,
                        courseId: courseId,
                        status: lId === lessonId ? 'current' : (isCompleted ? 'completed' : 'available'),
                        isCompleted,
                    };

                    return {
                        ...academyLesson,
                        progress,
                    };
                });

            return resolveRouteQuizzes(academyProgressService, quizzesService, courseId, lessonId, quizzes || []).pipe(
                switchMap((routeQuizzes) =>
                    buildQuizResolvedData(
                        course,
                        lessonsWithProgress,
                        quizzes || [],
                        routeQuizzes,
                        questionsService,
                        optionsService,
                    ),
                ),
                catchError(() => of<QuizResolvedData>({
                    course,
                    lessonsWithProgress,
                    quizzes: quizzes || [],
                    activeQuiz: null,
                    questions: [],
                })),
            );
        }),
        catchError(() => of(null))
    );
};

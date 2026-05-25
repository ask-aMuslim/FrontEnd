import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, take, map } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { LessonContentService, LessonNoteItem } from '../../../core/services/lesson-content.service';
import {
    AcademyCourse,
    AcademyLesson,
    LessonProgress,
} from '../../../core/models/interfaces/academy-progress.model';
import { QuizReadDto } from '../../../api/facades/quiz.facade';
import { LessonData } from '../../../core/models/interfaces/lesson-content.model';

export interface LessonPlayerResolvedData {
    course: AcademyCourse;
    lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[];
    quizzes: QuizReadDto[];
    lessonData: LessonData;
    notes: LessonNoteItem[];
}

export const lessonPlayerResolver: ResolveFn<LessonPlayerResolvedData | null> = (route) => {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) {
        return of(null);
    }

    const courseId = route.paramMap.get('courseId') || '';
    const lessonId = route.paramMap.get('lessonId') || '';

    if (!courseId || !lessonId) {
        return of(null);
    }

    const academyProgressService = inject(AcademyProgressService);
    const lessonContentService = inject(LessonContentService);

    return combineLatest([
        academyProgressService.getCourseByIdDirect(courseId).pipe(take(1)),
        academyProgressService.getCourseQuizzesDirect(courseId).pipe(take(1)),
        lessonContentService.getLesson(lessonId).pipe(take(1)),
        lessonContentService.getLessonNotes(lessonId).pipe(take(1), catchError(() => of([]))),
        academyProgressService.getCourseLessonsWithProgress(courseId).pipe(take(1), catchError(() => of([]))),
    ]).pipe(
        take(1),
        map(([rawCourse, quizzes, lessonData, notes, lessonsWithProgress]) => {
            if (!rawCourse || !lessonData) {
                return null;
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

            let finalLessons = lessonsWithProgress;
            if (!finalLessons || finalLessons.length === 0) {
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

                finalLessons = rawLessons
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
            }

            const lessonsWithProgressEnriched = finalLessons.map((lesson) => ({
                ...lesson,
                progress: {
                    ...lesson.progress,
                    status: lesson.id === lessonId ? 'current' : lesson.progress.status
                }
            }));

            return {
                course,
                lessonsWithProgress: lessonsWithProgressEnriched,
                quizzes: quizzes || [],
                lessonData,
                notes,
            };
        }),
        catchError(() => of(null)),
    );
};

import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, take, switchMap } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { LessonContentService, LessonNoteItem } from '../../../core/services/lesson-content.service';
import { AuthService } from '../../../core/services/auth.service';
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
    const quizzesService = inject(QuizzesService);
    const lessonContentService = inject(LessonContentService);
    const authService = inject(AuthService);

    if (!authService.isAuthenticated()) {
        return of(null);
    }

    return combineLatest([
        academyProgressService.getAcademyCourseById(courseId).pipe(take(1)),
        academyProgressService.getCourseLessonsWithProgress(courseId).pipe(take(1)),
        quizzesService.getAll({ courseId, pageSize: 200 }).pipe(take(1)),
        lessonContentService.getLesson(lessonId).pipe(take(1)),
        lessonContentService.getLessonNotes(lessonId).pipe(take(1), catchError(() => of([]))),
    ]).pipe(
        take(1),
        switchMap((res) => {
            if (!res || !res[0] || !res[1] || !res[3]) {
                return of(null);
            }
            return of<LessonPlayerResolvedData>({
                course: res[0],
                lessonsWithProgress: res[1],
                quizzes: res[2],
                lessonData: res[3],
                notes: res[4],
            });
        }),
        catchError(() => of(null)),
    );
};

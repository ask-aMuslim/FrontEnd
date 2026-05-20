import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import {
    AcademyProgressService,
    CourseEnrollmentState,
} from '../../../core/services/academy-progress.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import {
    AcademyCourse,
    AcademyLesson,
    AcademyStageApi,
    CourseProgress,
    LessonProgress,
} from '../../../core/models/interfaces/academy-progress.model';
import { QuizReadDto } from '../../../api/facades/quiz.facade';

export interface CourseResolvedData {
    courseData: AcademyCourse;
    courseProgress: CourseProgress | undefined;
    lessonsWithProgress: (AcademyLesson & { progress: LessonProgress })[];
    stages: AcademyStageApi[];
    enrollmentState: CourseEnrollmentState | undefined;
    quizzes: QuizReadDto[];
    prerequisitesList: { id: string; title: string; isCompleted: boolean }[];
}

export const courseResolver: ResolveFn<CourseResolvedData | null> = (route) => {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) {
        return of(null);
    }

    const courseId = route.paramMap.get('id') || '';
    if (!courseId) {
        return of(null);
    }

    const academyProgressService = inject(AcademyProgressService);
    const quizzesService = inject(QuizzesService);

    return academyProgressService.getAcademyCourseById(courseId).pipe(
        take(1),
        switchMap((courseData) => {
            if (courseData?.id !== courseId) {
                return of(null);
            }

            const prerequisites = courseData.prerequisites ?? [];
            return combineLatest([
                of(courseData),
                academyProgressService.getTargetedCourseProgress(courseId).pipe(take(1), catchError(() => of(undefined))),
                academyProgressService.getCourseLessonsWithProgress(courseId).pipe(take(1), catchError(() => of([]))),
                academyProgressService.getAcademyStages().pipe(take(1), catchError(() => of([]))),
                academyProgressService.getCurrentStudentCourseEnrollment(courseId).pipe(take(1), catchError(() => of(undefined))),
                quizzesService.getAll({ courseId, pageSize: 200 }).pipe(take(1), catchError(() => of([]))),
                academyProgressService.getTargetedPrerequisiteDetails(prerequisites).pipe(take(1), catchError(() => of([]))),
            ]).pipe(
                take(1),
                switchMap(([
                    courseInfo,
                    courseProgress,
                    lessonsWithProgress,
                    stages,
                    enrollmentState,
                    quizzes,
                    prerequisitesList,
                ]) => {
                    return of<CourseResolvedData>({
                        courseData: courseInfo,
                        courseProgress,
                        lessonsWithProgress,
                        stages,
                        enrollmentState,
                        quizzes,
                        prerequisitesList,
                    });
                }),
                catchError(() => of(null)),
            );
        }),
        catchError(() => of(null)),
    );
};

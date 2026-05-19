import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { ACADEMY_COURSES } from '../../../core/services/academy-data';
import { AcademyCourse } from '../../../core/models/interfaces/academy-progress.model';

export interface CongratulationsResolvedData {
    course: AcademyCourse;
    nextCourse: AcademyCourse | null;
}

export const congratulationsResolver: ResolveFn<CongratulationsResolvedData | null> = (route) => {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) {
        return of(null);
    }

    const courseId = route.paramMap.get('courseId') || '';
    if (!courseId) {
        return of(null);
    }

    const academyProgressService = inject(AcademyProgressService);
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

            return academyProgressService.getAcademyCourses().pipe(
                take(1),
                map((courses) => {
                    const orderedCourses = [...courses].sort((left, right) => {
                        const stageDifference = (left.stageId ?? 0) - (right.stageId ?? 0);
                        if (stageDifference !== 0) {
                            return stageDifference;
                        }

                        const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
                        const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
                        if (leftOrder !== rightOrder) {
                            return leftOrder - rightOrder;
                        }

                        return left.title.localeCompare(right.title);
                    });

                    const currentIndex = orderedCourses.findIndex((course) => course.id === courseId);
                    const nextCourse = currentIndex >= 0 ? orderedCourses[currentIndex + 1] : undefined;

                    return {
                        course: resolvedCourse,
                        nextCourse: nextCourse ?? null,
                    };
                }),
                catchError(() => of({
                    course: resolvedCourse,
                    nextCourse: null,
                }))
            );
        }),
        catchError(() => of(null))
    );
};

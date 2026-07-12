import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
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

    return academyProgressService.getCourseByIdDirect(courseId).pipe(
        take(1),
        map((course) => {
            if (!course) {
                return null;
            }

            const mappedCourse: AcademyCourse = {
                id: course.id ?? '',
                stageId: 1,
                levelId: course.levelId ?? '',
                title: course.title ?? '',
                isPublished: course.isPublished,
                category: 'Other',
                duration: (course['courseDuration'] as string) ?? (course['duration'] as string) ?? '0m',
                order: course.order ?? 0,
                prerequisites: course.prerequisiteIds ?? [],
                description: course.description,
                levelName: (course['levelName'] as string) ?? (course.level as string) ?? ''
            } as any;

            let nextCourse: AcademyCourse | null = null;
            const overviewCourses = academyProgressService.getOverviewCoursesCache();
            if (overviewCourses && overviewCourses.length > 0) {
                const orderedCourses = [...overviewCourses].sort((left, right) => {
                    const stageDifference = (left.stageId ?? 0) - (right.stageId ?? 0);
                    if (stageDifference !== 0) return stageDifference;
                    return (left.order ?? 0) - (right.order ?? 0);
                });
                const currentIndex = orderedCourses.findIndex((c) => c.id === courseId);
                if (currentIndex >= 0 && currentIndex < orderedCourses.length - 1) {
                    nextCourse = orderedCourses[currentIndex + 1];
                }
            }

            return {
                course: mappedCourse,
                nextCourse
            };
        }),
        catchError(() => of(null))
    );
};

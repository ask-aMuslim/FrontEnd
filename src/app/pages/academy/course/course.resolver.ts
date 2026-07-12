import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { CourseReadByIdDto } from '../../../api/facades/course.facade';

export interface CourseResolvedData {
    courseData: CourseReadByIdDto;
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

    return academyProgressService.getCourseByIdDirect(courseId).pipe(
        take(1),
        map((courseData): CourseResolvedData | null =>
            courseData ? { courseData } : null
        ),
        catchError(() => of(null)),
    );
};

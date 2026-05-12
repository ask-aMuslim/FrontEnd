import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, filter, take, catchError } from 'rxjs/operators';
import { AcademyProgressService } from '../../core/services/academy-progress.service';
import { AuthService } from '../../core/services/auth.service';
import {
    AcademyCourse,
    AcademyLesson,
    AcademyStageApi,
    StudentProgress,
} from '../../core/models/interfaces/academy-progress.model';

export interface AcademyResolvedData {
    stages: AcademyStageApi[];
    courses: AcademyCourse[];
    progress: StudentProgress;
    recentCourseLessons: AcademyLesson[];
}

export const academyResolver: ResolveFn<AcademyResolvedData | null> = () => {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) {
        return of(null);
    }

    const academyProgressService = inject(AcademyProgressService);
    const authService = inject(AuthService);

    if (!authService.isAuthenticated()) {
        return of(null);
    }

    return forkJoin({
        stages: academyProgressService.getAcademyStages(),
        courses: academyProgressService.getAcademyCourses(),
        progress: academyProgressService.progress$.pipe(
            filter((p): p is StudentProgress => p !== null),
            take(1),
        ),
    }).pipe(
        switchMap(({ stages, courses, progress }) => {
            if (!progress.recentLesson) {
                return of<AcademyResolvedData>({
                    stages,
                    courses,
                    progress,
                    recentCourseLessons: [],
                });
            }

            return academyProgressService
                .getAcademyLessons(progress.recentLesson.courseId)
                .pipe(
                    map<AcademyLesson[], AcademyResolvedData>((recentCourseLessons) => ({
                        stages,
                        courses,
                        progress,
                        recentCourseLessons,
                    })),
                    catchError(() =>
                        of<AcademyResolvedData>({
                            stages,
                            courses,
                            progress,
                            recentCourseLessons: [],
                        }),
                    ),
                );
        }),
        catchError(() => of(null)),
    );
};

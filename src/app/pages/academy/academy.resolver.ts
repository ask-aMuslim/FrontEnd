import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { filter, take, catchError } from 'rxjs/operators';
import { AcademyProgressService } from '../../core/services/academy-progress.service';
import {
    AcademyCourse,
    AcademyStageApi,
    StudentProgress,
} from '../../core/models/interfaces/academy-progress.model';

export interface AcademyResolvedData {
    stages: AcademyStageApi[];
    courses: AcademyCourse[];
    progress: StudentProgress;
}

export const academyResolver: ResolveFn<AcademyResolvedData | null> = () => {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformBrowser(platformId)) {
        return of(null);
    }

    const academyProgressService = inject(AcademyProgressService);

    return forkJoin({
        stages: academyProgressService.getAcademyStages(),
        courses: academyProgressService.getAcademyOverviewCourses(),
        progress: academyProgressService.progress$.pipe(
            filter((p): p is StudentProgress => p !== null),
            take(1),
        ),
    }).pipe(
        catchError(() => of(null)),
    );
};

import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SKIP_LOADING } from '../../core/http/context-tokens';

export interface LessonVideoProgressPayload {
    courseId: string;
    lessonId: string;
    videoProgressPercentage: number;
}

@Injectable({ providedIn: 'root' })
export class LessonProgressFacade {
    private readonly skipLoadingContext = new HttpContext().set(SKIP_LOADING, true);

    constructor(private readonly api: ApiService) { }

    saveLessonVideoProgress(payload: LessonVideoProgressPayload): Observable<boolean> {
        return this.api
            .post<unknown>('/api/Progress/lesson/complete', payload, { context: this.skipLoadingContext })
            .pipe(
                map(() => true),
                catchError(() =>
                    this.api
                        .post<unknown>('/api/Progress/Lesson/Complete', payload, { context: this.skipLoadingContext })
                        .pipe(
                            map(() => true),
                            catchError(() => of(false)),
                        )
                ),
            );
    }
}

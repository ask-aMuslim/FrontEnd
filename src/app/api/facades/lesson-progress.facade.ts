import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SKIP_LOADING } from '../../core/http/context-tokens';

export interface LessonProgressPayload {
    courseId: string;
    lessonId: string;
    progressPercentage?: number;
    markAsRead?: boolean;
    /**
     * Backward-compatible alias used by older callers while the new API shape is rolled out.
     */
    videoProgressPercentage?: number;
}

export interface LessonVideoProgressPayload extends LessonProgressPayload { }

@Injectable({ providedIn: 'root' })
export class LessonProgressFacade {
    private readonly skipLoadingContext = new HttpContext().set(SKIP_LOADING, true);

    constructor(private readonly api: ApiService) { }

    saveLessonProgress(payload: LessonProgressPayload): Observable<boolean> {
        const body = this.normalizePayload(payload);

        return this.api
            .post<unknown>('/api/Progress/lesson/complete', body, { context: this.skipLoadingContext })
            .pipe(
                map(() => true),
                catchError(() =>
                    this.api
                        .post<unknown>('/api/Progress/Lesson/Complete', body, { context: this.skipLoadingContext })
                        .pipe(
                            map(() => true),
                            catchError(() => of(false)),
                        )
                ),
            );
    }

    saveLessonVideoProgress(payload: LessonVideoProgressPayload): Observable<boolean> {
        return this.saveLessonProgress(payload);
    }

    private normalizePayload(payload: LessonProgressPayload): LessonProgressPayload {
        if (payload.markAsRead) {
            return {
                courseId: payload.courseId,
                lessonId: payload.lessonId,
                markAsRead: true,
            };
        }

        const percentage = this.normalizePercentage(
            payload.progressPercentage ?? payload.videoProgressPercentage ?? 0,
        );

        return {
            courseId: payload.courseId,
            lessonId: payload.lessonId,
            progressPercentage: percentage,
        };
    }

    private normalizePercentage(value: number): number {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.min(100, Math.round(value)));
    }
}

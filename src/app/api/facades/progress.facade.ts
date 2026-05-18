import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, finalize } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';
import { SKIP_LOADING } from '../../core/http/context-tokens';

export interface ProgressCreateDto {
    courseId: string;
    studentId: string;
    totalLessonsCompleted: number;
    completedProgress: boolean;
}

export interface ProgressUpdateDto {
    totalLessonsCompleted: number;
}

export interface CourseProgressSummaryDto {
    completedLessonsCount?: number;
    totalLessonsCount?: number;
    progressPercentage?: number;
    isCompleted?: boolean;
    [key: string]: unknown;
}

export interface ProgressReadDto {
    id?: string;
    courseId?: string;
    progress?: number;
    isCompleted?: boolean;
    completedProgress?: boolean;
    totalLessonsCompleted?: number;
    lessonCompletionRate?: number;
    lastUpdated?: string;
    isCertified?: boolean;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ProgressFacade {
    private readonly skipLoadingContext = new HttpContext().set(SKIP_LOADING, true);
    private readonly activeRequests = new Map<string, Observable<any>>();

    constructor(private readonly _api: ApiService) { }

    getProgressByStudentId(studentId: string): Observable<ProgressReadDto[]> {
        return extractData(
            this._api.get<unknown>(`/api/Progress/GetProgressByStudentId/ByStudent/${studentId}`, undefined, {
                context: this.skipLoadingContext,
            }),
            [],
        ).pipe(map(asArray<ProgressReadDto>));
    }

    createProgress(payload: ProgressCreateDto): Observable<ProgressReadDto | null> {
        return extractData(
            this._api.post<unknown>('/api/Progress/CreateProgress', payload, {
                context: this.skipLoadingContext,
            }),
            null,
        );
    }

    updateProgress(progressId: string, payload: ProgressUpdateDto): Observable<boolean> {
        return this._api
            .put<unknown>(`/api/Progress/UpdateProgress/${progressId}`, payload, {
                context: this.skipLoadingContext,
            })
            .pipe(map(() => true));
    }

    getCourseProgress(courseId: string): Observable<CourseProgressSummaryDto | null> {
        const cacheKey = `courseProgress_${courseId}`;
        if (this.activeRequests.has(cacheKey)) return this.activeRequests.get(cacheKey)!;

        const request$ = extractData(
            this._api.get<unknown>(`/api/Progress/course/${courseId}`, undefined, {
                context: this.skipLoadingContext,
            }),
            null,
        ).pipe(
            map((payload) => this.normalizeCourseProgressSummary(payload)),
            catchError(() =>
                extractData(
                    this._api.get<unknown>(`/api/Progress/GetProgressByCourseId/ByCourse/${courseId}`, undefined, {
                        context: this.skipLoadingContext,
                    }),
                    null,
                ).pipe(
                    map((payload) => this.normalizeCourseProgressSummary(payload)),
                    catchError(() => of(null)),
                )
            ),
            finalize(() => this.activeRequests.delete(cacheKey)),
            shareReplay(1)
        );

        this.activeRequests.set(cacheKey, request$);
        return request$;
    }

    private normalizeCourseProgressSummary(payload: unknown): CourseProgressSummaryDto | null {
        if (!payload) {
            return null;
        }

        const rawSummary = Array.isArray(payload) ? payload[0] : payload;
        if (!rawSummary || typeof rawSummary !== 'object') {
            return null;
        }

        const summary = rawSummary as Record<string, unknown>;

        const completedLessonsCount = this.readNumber(summary['completedLessonsCount'])
            ?? this.readNumber(summary['totalLessonsCompleted']);
        const totalLessonsCount = this.readNumber(summary['totalLessonsCount']);
        const progressPercentage = this.readNumber(summary['progressPercentage'])
            ?? this.readNumber(summary['lessonCompletionRate'])
            ?? this.readNumber(summary['progress']);
        const isCompleted = this.readBoolean(summary['isCompleted'])
            ?? this.readBoolean(summary['completedProgress']);

        if (
            completedLessonsCount === undefined
            && totalLessonsCount === undefined
            && progressPercentage === undefined
            && isCompleted === undefined
        ) {
            return null;
        }

        return {
            completedLessonsCount,
            totalLessonsCount,
            progressPercentage,
            isCompleted,
        };
    }

    private readNumber(value: unknown): number | undefined {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : undefined;
        }

        if (typeof value === 'string') {
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        }

        return undefined;
    }

    private readBoolean(value: unknown): boolean | undefined {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'number') {
            return value > 0;
        }

        if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            return lower === 'true' || lower === '1' || lower === 'yes';
        }

        return undefined;
    }
}

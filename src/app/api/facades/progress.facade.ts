import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

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
    constructor(private readonly _api: ApiService) { }

    getProgressByStudentId(studentId: string): Observable<ProgressReadDto[]> {
        return extractData(
            this._api.get<unknown>(`/api/Progress/GetProgressByStudentId/ByStudent/${studentId}`),
            [],
        ).pipe(map(asArray<ProgressReadDto>));
    }

    createProgress(payload: ProgressCreateDto): Observable<ProgressReadDto | null> {
        return extractData(this._api.post<unknown>('/api/Progress/CreateProgress', payload), null);
    }

    updateProgress(progressId: string, payload: ProgressUpdateDto): Observable<boolean> {
        return this._api
            .put<unknown>(`/api/Progress/UpdateProgress/${progressId}`, payload)
            .pipe(map(() => true));
    }

    getCourseProgress(courseId: string): Observable<CourseProgressSummaryDto | null> {
        return extractData(this._api.get<unknown>(`/api/Progress/course/${courseId}`), null);
    }
}

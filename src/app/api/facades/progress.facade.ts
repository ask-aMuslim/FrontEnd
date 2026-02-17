import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface ProgressReadDto {
    id?: string;
    studentId?: string;
    courseId?: string;
    progress?: number;
    isCompleted?: boolean;
    totalLessonsCompleted?: number;
    lessonCompletionRate?: number;
    isCertified?: boolean;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ProgressFacade {
    constructor(private readonly api: ApiService) { }

    getProgressByStudentId(studentId: string): Observable<ProgressReadDto[]> {
        return extractData(this.api.get<unknown>(`/api/Progress/GetProgressByStudentId/ByStudent/${studentId}`), []).pipe(
            map(asArray<ProgressReadDto>)
        );
    }
}

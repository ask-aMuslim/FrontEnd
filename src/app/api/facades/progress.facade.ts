import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

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
    constructor(private readonly _api: ApiService) { }

    getProgressByStudentId(_studentId: string): Observable<ProgressReadDto[]> {
        return of([]);
    }
}

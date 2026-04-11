import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface LessonVideoProgressPayload {
    courseId: string;
    lessonId: string;
    videoProgressPercentage: number;
}

@Injectable({ providedIn: 'root' })
export class LessonProgressFacade {
    constructor(private readonly api: ApiService) { }

    saveLessonVideoProgress(payload: LessonVideoProgressPayload): Observable<boolean> {
        return this.api
            .post<unknown>('/api/Progress/lesson/complete', payload)
            .pipe(map(() => true));
    }
}

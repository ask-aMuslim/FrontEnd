import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';
import { CreateQuizAttemptCommand } from '../models/create-quiz-attempt-command';
import { CompleteQuizAttemptCommand } from '../models/complete-quiz-attempt-command';

export interface QuizAttemptReadDto {
    id?: string;
    quizId?: string;
    studentId?: string;
    score?: number;
    isPassed?: boolean;
    startedAt?: string;
    completedAt?: string;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class QuizAttemptFacade {
    constructor(private readonly api: ApiService) { }

    getAttemptsByQuiz(quizId: string): Observable<QuizAttemptReadDto[]> {
        return extractData(this.api.get<unknown>(`/api/QuizAttempts/by-quiz/${quizId}`), []).pipe(
            map(asArray<QuizAttemptReadDto>)
        );
    }

    getAttemptsByStudent(studentId: string): Observable<QuizAttemptReadDto[]> {
        return extractData(this.api.get<unknown>(`/api/QuizAttempts/by-student/${studentId}`), []).pipe(
            map(asArray<QuizAttemptReadDto>)
        );
    }

    startAttempt(payload: CreateQuizAttemptCommand): Observable<string | null> {
        return this.api.post<unknown>('/api/QuizAttempts', payload).pipe(
            map((response) => this.extractId(response))
        );
    }

    completeAttempt(attemptId: string, payload: CompleteQuizAttemptCommand): Observable<boolean> {
        return this.api.put<unknown>(`/api/QuizAttempts/complete/${attemptId}`, payload).pipe(
            map(() => true)
        );
    }

    private extractId(response: unknown): string | null {
        const direct = this.nonEmptyString(response);
        if (direct) {
            return direct;
        }

        const record = this.asRecord(response);
        const rootId = this.nonEmptyString(record?.['id']);
        if (rootId) {
            return rootId;
        }

        const data = record?.['data'];
        const dataId = this.nonEmptyString(data);
        if (dataId) {
            return dataId;
        }

        const dataRecord = this.asRecord(data);
        return this.nonEmptyString(dataRecord?.['id']);
    }

    private asRecord(value: unknown): Record<string, unknown> | null {
        return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
    }

    private nonEmptyString(value: unknown): string | null {
        return typeof value === 'string' && value.length > 0 ? value : null;
    }
}

import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface QuestionReadDto {
    id?: string;
    quizId?: string;
    text?: string;
    [key: string]: unknown;
}

export type QuestionCreateDto = Record<string, unknown>;
export type QuestionUpdateDto = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class QuestionFacade {
    constructor(private readonly api: ApiService) { }

    getAllQuestions(): Observable<QuestionReadDto[]> {
        return extractData(this.api.get<unknown>('/api/Questions'), []).pipe(map(asArray<QuestionReadDto>));
    }

    getQuestionById(id: string): Observable<QuestionReadDto | null> {
        return extractData(this.api.get<unknown>(`/api/Questions/${id}`), null);
    }

    createQuestion(payload: QuestionCreateDto): Observable<QuestionReadDto | null> {
        return extractData(this.api.post<unknown>('/api/Questions', payload), null);
    }

    updateQuestion(id: string, payload: QuestionUpdateDto): Observable<QuestionReadDto | null> {
        return extractData(this.api.put<unknown>(`/api/Questions/${id}`, payload), null);
    }

    deleteQuestion(id: string): Observable<boolean> {
        return this.api.delete<unknown>(`/api/Questions/${id}`).pipe(map(() => true));
    }
}

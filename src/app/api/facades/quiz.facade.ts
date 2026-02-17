import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface QuizReadDto {
    id?: string;
    title?: string;
    lessonId?: string;
    [key: string]: unknown;
}

export type QuizCreateDto = Record<string, unknown>;
export type QuizUpdateDto = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class QuizFacade {
    constructor(private readonly api: ApiService) { }

    getAllQuizzes(): Observable<QuizReadDto[]> {
        return extractData(this.api.get<unknown>('/api/Quizzes'), []).pipe(map(asArray<QuizReadDto>));
    }

    getQuizById(id: string): Observable<QuizReadDto | null> {
        return extractData(this.api.get<unknown>(`/api/Quizzes/${id}`), null);
    }

    createQuiz(payload: QuizCreateDto): Observable<QuizReadDto | null> {
        return extractData(this.api.post<unknown>('/api/Quizzes', payload), null);
    }

    updateQuiz(id: string, payload: QuizUpdateDto): Observable<QuizReadDto | null> {
        return extractData(this.api.put<unknown>(`/api/Quizzes/${id}`, payload), null);
    }

    deleteQuiz(id: string): Observable<boolean> {
        return this.api.delete<unknown>(`/api/Quizzes/${id}`).pipe(map(() => true));
    }
}

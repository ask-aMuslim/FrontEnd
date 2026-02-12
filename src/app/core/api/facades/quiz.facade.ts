/**
 * Quiz Facade Service
 * 
 * Wraps generated API functions for quiz operations.
 * Uses ErrorNormalizer for consistent error handling.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { ApiError } from '../../errors/api-error.model';

// Generated function imports
import { apiQuizGet$Json } from '../generated/fn/quiz/api-quiz-get-json';
import { apiQuizIdGet$Json } from '../generated/fn/quiz/api-quiz-id-get-json';
import { apiQuizPost$Json } from '../generated/fn/quiz/api-quiz-post-json';
import { apiQuizIdPut } from '../generated/fn/quiz/api-quiz-id-put';
import { apiQuizIdDelete } from '../generated/fn/quiz/api-quiz-id-delete';

// Generated model imports
import type { QuizReadDto } from '../generated/models/quiz-read-dto';

@Injectable({ providedIn: 'root' })
export class QuizFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state
    private readonly _loading = signal(false);
    private readonly _error = signal<ApiError | null>(null);
    private readonly _currentQuiz = signal<QuizReadDto | null>(null);

    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly currentQuiz = this._currentQuiz.asReadonly();

    /**
     * Get all quizzes
     */
    getAllQuizzes(): Observable<QuizReadDto[]> {
        this._loading.set(true);
        this._error.set(null);

        return apiQuizGet$Json(this.http, this.config.rootUrl).pipe(
            map(response => response.body ?? []),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Create a new quiz
     */
    createQuiz(data: any): Observable<QuizReadDto> {
        this._loading.set(true);
        this._error.set(null);

        return apiQuizPost$Json(this.http, this.config.rootUrl, { body: data }).pipe(
            map(response => response.body),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Update a quiz
     */
    updateQuiz(id: string, data: any): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        const params: any = {
            id,
            body: data
        };

        return apiQuizIdPut(this.http, this.config.rootUrl, params).pipe(
            map(response => response.body),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Delete a quiz
     */
    deleteQuiz(id: string): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiQuizIdDelete(this.http, this.config.rootUrl, { id }).pipe(
            map(response => response.body),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Get quiz by ID
     */
    getQuizById(id: string): Observable<QuizReadDto> {
        this._loading.set(true);
        this._error.set(null);

        return apiQuizIdGet$Json(this.http, this.config.rootUrl, { id }).pipe(
            map(response => response.body),
            tap(quiz => {
                this._currentQuiz.set(quiz);
                this._loading.set(false);
            }),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Get quiz by course ID
     * Note: This endpoint may not be available in the generated API
     */
    getQuizByCourseId(courseId: string): Observable<QuizReadDto> {
        this._loading.set(true);
        this._error.set(null);

        // Try to get quiz by course ID - this may need adjustment based on actual API
        return this.http.get<QuizReadDto>(`${this.config.rootUrl}/api/Quiz/by-course/${courseId}`).pipe(
            tap(quiz => {
                this._currentQuiz.set(quiz);
                this._loading.set(false);
            }),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Clear any error message
     */
    clearError(): void {
        this._error.set(null);
    }

    /**
     * Clear current quiz
     */
    clearCurrentQuiz(): void {
        this._currentQuiz.set(null);
    }
}

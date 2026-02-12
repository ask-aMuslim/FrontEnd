/**
 * Answer Facade Service
 * 
 * Wraps generated API functions for answer-related operations.
 * Provides RxJS-based reactive patterns, error handling, and caching.
 * Uses ErrorNormalizer for consistent error handling.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { ApiError } from '../../errors/api-error.model';

// Generated function imports (note: ng-openapi-gen uses $ in function names)
import { apiAnswerGet$Json } from '../generated/fn/answer/api-answer-get-json';
import { apiAnswerPost$Json } from '../generated/fn/answer/api-answer-post-json';
import { apiAnswerStudentIdQuestionIdDelete } from '../generated/fn/answer/api-answer-student-id-question-id-delete';
import { apiAnswerStudentIdQuestionIdGet$Json } from '../generated/fn/answer/api-answer-student-id-question-id-get-json';
import { apiAnswerStudentIdQuestionIdPut$Json } from '../generated/fn/answer/api-answer-student-id-question-id-put-json';

// Generated model imports
import type { AnswerCreateDto } from '../generated/models/answer-create-dto';
import type { AnswerReadDto } from '../generated/models/answer-read-dto';
import type { AnswerUpdateDto } from '../generated/models/answer-update-dto';

@Injectable({ providedIn: 'root' })
export class AnswerFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state using signals
    private readonly _loading = signal(false);
    private readonly _error = signal<ApiError | null>(null);
    private readonly _answers = signal<AnswerReadDto[]>([]);

    // Public computed properties
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly answers = this._answers.asReadonly();

    /**
     * Get all answers
     */
    getAllAnswers(): Observable<AnswerReadDto[]> {
        this._loading.set(true);
        this._error.set(null);

        return apiAnswerGet$Json(this.http, this.config.rootUrl).pipe(
            map(response => response.body ?? []),
            tap(answers => {
                this._answers.set(answers);
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
     * Get a specific answer by student ID and question ID
     */
    getAnswerById(studentId: string, questionId: string): Observable<AnswerReadDto | null> {
        this._loading.set(true);
        this._error.set(null);

        return apiAnswerStudentIdQuestionIdGet$Json(this.http, this.config.rootUrl, { studentId, questionId }).pipe(
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
     * Create a new answer
     */
    createAnswer(data: AnswerCreateDto): Observable<AnswerReadDto | null> {
        this._loading.set(true);
        this._error.set(null);

        return apiAnswerPost$Json(this.http, this.config.rootUrl, { body: data }).pipe(
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
     * Update an existing answer
     */
    updateAnswer(studentId: string, questionId: string, data: AnswerUpdateDto): Observable<AnswerReadDto | null> {
        this._loading.set(true);
        this._error.set(null);

        return apiAnswerStudentIdQuestionIdPut$Json(this.http, this.config.rootUrl, { studentId, questionId, body: data }).pipe(
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
     * Delete an answer
     */
    deleteAnswer(studentId: string, questionId: string): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiAnswerStudentIdQuestionIdDelete(this.http, this.config.rootUrl, { studentId, questionId }).pipe(
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
     * Clear any error message
     */
    clearError(): void {
        this._error.set(null);
    }
}

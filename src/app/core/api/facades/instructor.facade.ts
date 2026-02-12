/**
 * Instructor Facade Service
 * 
 * Wraps generated API functions for instructor operations.
 * Uses ErrorNormalizer for consistent error handling.
 * Implements legacy endpoints manually where missing.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { ApiError } from '../../errors/api-error.model';

// Generated function imports
import { apiInstructorGetAllInstructorsGet } from '../generated/fn/instructor/api-instructor-get-all-instructors-get';
import { apiInstructorGetInstructorByIdIdGet } from '../generated/fn/instructor/api-instructor-get-instructor-by-id-id-get';
import { apiInstructorGetInstructorByCourseIdIdInstructorGet } from '../generated/fn/instructor/api-instructor-get-instructor-by-course-id-id-instructor-get';

@Injectable({ providedIn: 'root' })
export class InstructorFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state
    private readonly _loading = signal(false);
    private readonly _error = signal<ApiError | null>(null);

    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    /**
     * Get all instructors
     */
    getAllInstructors(): Observable<any[]> {
        this._loading.set(true);
        this._error.set(null);

        // Manual call because generated client returns void
        return this.http.get<any[]>(`${this.config.rootUrl}/api/Instructor/GetAllInstructors`).pipe(
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
     * Get instructor by ID
     */
    getInstructorById(id: string): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return apiInstructorGetInstructorByIdIdGet(this.http, this.config.rootUrl, { id }).pipe(
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
     * Get instructor by Course ID
     */
    getInstructorByCourseId(id: string): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return apiInstructorGetInstructorByCourseIdIdInstructorGet(this.http, this.config.rootUrl, { id }).pipe(
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
     * Get current instructor profile (Legacy)
     */
    me(): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        // Fallback to manual HTTP call since generated code might lack it
        return this.http.get<any>(`${this.config.rootUrl}/api/Instructors/me`).pipe(
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
     * Update instructor profile (Legacy)
     */
    update(data: any): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.put<any>(`${this.config.rootUrl}/api/Instructors/me`, data).pipe(
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

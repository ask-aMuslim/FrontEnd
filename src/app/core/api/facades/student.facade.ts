/**
 * Student Facade Service
 * 
 * Wraps generated API functions for student operations.
 * Uses ErrorNormalizer for consistent error handling.
 * Implements legacy endpoints using HttpClient where missing from generated spec.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { ApiError } from '../../errors/api-error.model';

// Generated function imports
import { apiStudentGet } from '../generated/fn/student/api-student-get';
import { apiStudentIdGet } from '../generated/fn/student/api-student-id-get';
import { apiStudentGetAllCoursesGet } from '../generated/fn/student/api-student-get-all-courses-get';

@Injectable({ providedIn: 'root' })
export class StudentFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state
    private readonly _loading = signal(false);
    private readonly _error = signal<ApiError | null>(null);

    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    /**
     * Get all students
     */
    getAllStudents(): Observable<any[]> {
        this._loading.set(true);
        this._error.set(null);

        // Manual call because generated client returns void
        return this.http.get<any[]>(`${this.config.rootUrl}/api/Student`).pipe(
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
     * Get student by ID
     */
    getStudentById(id: string): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return apiStudentIdGet(this.http, this.config.rootUrl, { id }).pipe(
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
     * Get all courses for a student
     */
    getAllCourses(studentId?: string): Observable<any[]> {
        this._loading.set(true);
        this._error.set(null);

        const params: any = {};
        if (studentId) params.StudentId = studentId;

        // Manual call because generated client returns void
        return this.http.get<any[]>(`${this.config.rootUrl}/api/Student/GetAllCourses`, { params }).pipe(
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
     * Get current student profile (Legacy)
     */
    me(): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<any>(`${this.config.rootUrl}/api/Students/me`).pipe(
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
     * Get student dashboard (Legacy)
     */
    dashboard(): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<any>(`${this.config.rootUrl}/api/Students/dashboard`).pipe(
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
     * Update student profile (Legacy)
     */
    update(data: any): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.put<any>(`${this.config.rootUrl}/api/Students/me`, data).pipe(
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

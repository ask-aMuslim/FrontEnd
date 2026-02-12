/**
 * Enrollment Facade Service
 * 
 * Wraps generated API functions for enrollment operations.
 * Uses ErrorNormalizer for consistent error handling.
 * NOTE: Getters use HttpClient directly because generated clients return void (Swagger spec issue).
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { ApiError } from '../../errors/api-error.model';

// Generated function imports
import { apiEnrollmentEnrollPost } from '../generated/fn/enrollment/api-enrollment-enroll-post';
import { apiEnrollmentUnEnrollDelete } from '../generated/fn/enrollment/api-enrollment-un-enroll-delete';

// Generated model imports
import type { EnrollmentCreateDto } from '../generated/models/enrollment-create-dto';

@Injectable({ providedIn: 'root' })
export class EnrollmentFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state
    private readonly _loading = signal(false);
    private readonly _error = signal<ApiError | null>(null);

    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    /**
     * Create a new enrollment
     */
    createEnrollment(data: EnrollmentCreateDto): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return apiEnrollmentEnrollPost(this.http, this.config.rootUrl, { body: data }).pipe(
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
     * Get enrolled courses for the current student
     */
    getEnrolledCourses(studentId?: string): Observable<any[]> {
        this._loading.set(true);
        this._error.set(null);

        // Manual call because generated client returns void
        let url = `${this.config.rootUrl}/api/Enrollment/GetEnrolledCoursesByStudent`;
        if (studentId) {
            url += `?studentId=${studentId}`;
        }

        return this.http.get<any[]>(url).pipe(
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
     * Get specific enrollment details
     */
    getEnrollment(studentId?: string, courseId?: string): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        // Manual call because generated client returns void
        const params: any = {};
        if (studentId) params.studentId = studentId;
        if (courseId) params.courseId = courseId;

        return this.http.get<any>(`${this.config.rootUrl}/api/Enrollment/GetEnrollment`, { params }).pipe(
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
     * Un-enroll (delete enrollment)
     */
    deleteEnrollment(studentId: string, courseId: string): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiEnrollmentUnEnrollDelete(this.http, this.config.rootUrl, { studentId, courseId }).pipe(
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
     * Get students enrolled in a course
     */
    getStudentsByCourse(courseId: string): Observable<any[]> {
        this._loading.set(true);
        this._error.set(null);

        // Manual call because generated client returns void
        return this.http.get<any[]>(`${this.config.rootUrl}/api/Enrollment/GetStudentsEnrolledInCourse`, { params: { courseId } }).pipe(
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

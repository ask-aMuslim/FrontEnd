/**
 * Course Facade Service
 * 
 * Wraps generated API functions for course-related operations.
 * Provides RxJS-based reactive patterns, error handling, and caching.
 * Uses ErrorNormalizer for consistent error handling.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { ApiError } from '../../errors/api-error.model';

// Generated function imports
import { apiCourseGetCoursesGet$Json } from '../generated/fn/course/api-course-get-courses-get-json';
import { apiCourseGetCourseByIdIdGet$Json } from '../generated/fn/course/api-course-get-course-by-id-id-get-json';
import { apiCourseGetCourseByCategoryNameByNameCategoryNameGet$Json } from '../generated/fn/course/api-course-get-course-by-category-name-by-name-category-name-get-json';
import { apiCourseGetCourseByLevelNameByLevelNameLevelNameGet$Json } from '../generated/fn/course/api-course-get-course-by-level-name-by-level-name-level-name-get-json';
import { apiCourseCreateCoursePost$Json } from '../generated/fn/course/api-course-create-course-post-json';
import { apiCourseUpdateCourseIdPut } from '../generated/fn/course/api-course-update-course-id-put';
import { apiCourseDeleteCourseIdDelete } from '../generated/fn/course/api-course-delete-course-id-delete';

// Generated model imports
import type { CourseReadDto } from '../generated/models/course-read-dto';
import type { CourseReadByIdDto } from '../generated/models/course-read-by-id-dto';

@Injectable({ providedIn: 'root' })
export class CourseFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state using signals
    private readonly _loading = signal(false);
    private readonly _error = signal<ApiError | null>(null);
    private readonly _courses = signal<CourseReadDto[]>([]);

    // Public computed properties
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly courses = this._courses.asReadonly();

    // Cache for course list
    private coursesCache$: Observable<CourseReadDto[]> | null = null;

    /**
     * Get all courses with caching
     */
    getAllCourses(forceRefresh = false): Observable<CourseReadDto[]> {
        if (this.coursesCache$ && !forceRefresh) {
            return this.coursesCache$;
        }

        this._loading.set(true);
        this._error.set(null);

        this.coursesCache$ = apiCourseGetCoursesGet$Json(this.http, this.config.rootUrl).pipe(
            map(response => response.body ?? []),
            tap(courses => {
                this._courses.set(courses);
                this._loading.set(false);
            }),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            }),
            shareReplay({ bufferSize: 1, refCount: true })
        );

        return this.coursesCache$;
    }

    /**
     * Get a specific course by ID
     */
    getCourseById(id: string): Observable<CourseReadByIdDto> {
        this._loading.set(true);
        this._error.set(null);

        return apiCourseGetCourseByIdIdGet$Json(this.http, this.config.rootUrl, { id }).pipe(
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
     * Get courses by category name
     */
    getCoursesByCategory(categoryName: string): Observable<CourseReadDto[]> {
        this._loading.set(true);
        this._error.set(null);

        return apiCourseGetCourseByCategoryNameByNameCategoryNameGet$Json(
            this.http,
            this.config.rootUrl,
            { categoryName }
        ).pipe(
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
     * Get courses by level name
     */
    getCoursesByLevel(levelName: string): Observable<CourseReadDto[]> {
        this._loading.set(true);
        this._error.set(null);

        return apiCourseGetCourseByLevelNameByLevelNameLevelNameGet$Json(
            this.http,
            this.config.rootUrl,
            { levelName }
        ).pipe(
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
     * Create a new course
     */
    createCourse(data: any): Observable<any> {
        this._loading.set(true);
        this._error.set(null);

        return apiCourseCreateCoursePost$Json(this.http, this.config.rootUrl, { body: data }).pipe(
            map(response => response.body),
            tap(() => {
                this._loading.set(false);
                this.clearCache(); // Invalidate cache on change
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
     * Update an existing course
     */
    updateCourse(id: string, data: any): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiCourseUpdateCourseIdPut(this.http, this.config.rootUrl, { id, body: data }).pipe(
            map(response => response.body),
            tap(() => {
                this._loading.set(false);
                this.clearCache(); // Invalidate cache on change
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
     * Delete a course
     */
    deleteCourse(id: string): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiCourseDeleteCourseIdDelete(this.http, this.config.rootUrl, { id }).pipe(
            map(response => response.body),
            tap(() => {
                this._loading.set(false);
                this.clearCache(); // Invalidate cache on change
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
     * Clear the courses cache
     */
    clearCache(): void {
        this.coursesCache$ = null;
        this._courses.set([]);
    }

    /**
     * Clear any error message
     */
    clearError(): void {
        this._error.set(null);
    }
}

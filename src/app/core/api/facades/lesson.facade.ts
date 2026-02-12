/**
 * Lesson Facade Service
 * 
 * Wraps generated API functions for lesson operations.
 * Uses ErrorNormalizer for consistent error handling.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { ApiError } from '../../errors/api-error.model';

// Generated function imports
import { apiLessonGetAllLessonsGet$Json } from '../generated/fn/lesson/api-lesson-get-all-lessons-get-json';
import { apiLessonGetLessonByIdIdGet$Json } from '../generated/fn/lesson/api-lesson-get-lesson-by-id-id-get-json';
import { apiLessonGetCourseLessonsCourseIdGet$Json } from '../generated/fn/lesson/api-lesson-get-course-lessons-course-id-get-json';
import { apiLessonCreateLessonPost$Json } from '../generated/fn/lesson/api-lesson-create-lesson-post-json';
import { apiLessonUpdateLessonIdPut } from '../generated/fn/lesson/api-lesson-update-lesson-id-put';
import { apiLessonDeleteLessonIdDelete } from '../generated/fn/lesson/api-lesson-delete-lesson-id-delete';

// Generated model imports
import type { LessonReadDto } from '../generated/models/lesson-read-dto';

@Injectable({ providedIn: 'root' })
export class LessonFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state
    private readonly _loading = signal(false);
    private readonly _error = signal<ApiError | null>(null);
    private readonly _lessons = signal<LessonReadDto[]>([]);

    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly lessons = this._lessons.asReadonly();

    // Cache for course lessons
    private courseLessonsCache = new Map<string, Observable<LessonReadDto[]>>();

    /**
     * Get all lessons
     */
    getAllLessons(): Observable<LessonReadDto[]> {
        this._loading.set(true);
        this._error.set(null);

        return apiLessonGetAllLessonsGet$Json(this.http, this.config.rootUrl).pipe(
            map(response => response.body ?? []),
            tap(lessons => {
                this._lessons.set(lessons);
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
     * Get lesson by ID
     */
    getLessonById(id: string): Observable<LessonReadDto> {
        this._loading.set(true);
        this._error.set(null);

        return apiLessonGetLessonByIdIdGet$Json(this.http, this.config.rootUrl, { id }).pipe(
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
     * Get lessons for a specific course (with caching)
     */
    getCourseLessons(courseId: string, forceRefresh = false): Observable<LessonReadDto[]> {
        if (!forceRefresh && this.courseLessonsCache.has(courseId)) {
            return this.courseLessonsCache.get(courseId)!;
        }

        this._loading.set(true);
        this._error.set(null);

        const lessons$ = apiLessonGetCourseLessonsCourseIdGet$Json(
            this.http,
            this.config.rootUrl,
            { courseId }
        ).pipe(
            map(response => response.body ?? []),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError);
                return throwError(() => apiError);
            }),
            shareReplay({ bufferSize: 1, refCount: true })
        );

        this.courseLessonsCache.set(courseId, lessons$);
        return lessons$;
    }

    /**
     * Clear cache for a specific course or all courses
     */
    clearCache(courseId?: string): void {
        if (courseId) {
            this.courseLessonsCache.delete(courseId);
        } else {
            this.courseLessonsCache.clear();
        }
    }

    /**
     * Create a new lesson
     */
    createLesson(data: any): Observable<LessonReadDto> {
        this._loading.set(true);
        this._error.set(null);

        // Map generic data object to specific API params
        const params: any = {
            Title: data.Title,
            CourseId: data.CourseId,
            Content: data.Content,
            ExternalVideoUrl: data.ExternalVideoUrl,
            body: {
                Thumbnail: data.Thumbnail,
                Video: data.Video
            }
        };

        return apiLessonCreateLessonPost$Json(this.http, this.config.rootUrl, params).pipe(
            map(response => response.body),
            tap(() => {
                this._loading.set(false);
                this.clearCache(data.CourseId); // Clear specific course cache if possible
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
     * Update an existing lesson
     */
    updateLesson(id: string, data: any): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        const params: any = {
            id,
            Title: data.Title,
            Content: data.Content,
            ExternalVideoUrl: data.ExternalVideoUrl,
            body: {
                Thumbnail: data.Thumbnail,
                Video: data.Video
            }
        };

        return apiLessonUpdateLessonIdPut(this.http, this.config.rootUrl, params).pipe(
            map(response => response.body),
            tap(() => {
                this._loading.set(false);
                this.clearCache();
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
     * Delete a lesson
     */
    deleteLesson(id: string): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiLessonDeleteLessonIdDelete(this.http, this.config.rootUrl, { id }).pipe(
            map(response => response.body),
            tap(() => {
                this._loading.set(false);
                this.clearCache();
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
     * Save lesson progress (Legacy endpoint)
     */
    saveProgress(lessonId: string, progress: { completed: boolean; currentTime?: number }): Observable<void> {
        return this.http.post<void>(`${this.config.rootUrl}/Lessons/${lessonId}/progress`, progress);
    }

    /**
     * Get student notes (Legacy endpoint)
     */
    getNotes(lessonId: string): Observable<Array<{ id: string; timestamp: string; text: string; createdAt: string }>> {
        return this.http.get<any[]>(`${this.config.rootUrl}/StudentNotes/by-lesson/${lessonId}`);
    }

    /**
     * Add a note (Legacy endpoint)
     */
    addNote(lessonId: string, note: { timestamp: string; text: string }): Observable<any> {
        return this.http.post<any>(`${this.config.rootUrl}/StudentNotes`, { lessonId, ...note });
    }

    /**
     * Delete a note (Legacy endpoint)
     */
    deleteNote(noteId: string): Observable<void> {
        return this.http.delete<void>(`${this.config.rootUrl}/StudentNotes/${noteId}`);
    }

    /**
     * Clear any error message
     */
    clearError(): void {
        this._error.set(null);
    }
}

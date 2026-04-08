import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface LessonReadDto {
    id?: string;
    courseId?: string;
    title?: string;
    description?: string;
    content?: string;
    isPublished?: boolean;
    type?: number;
    videoUrl?: string;
    externalVideoUrl?: string;
    thumbnailUrl?: string;
    order?: number;
    [key: string]: unknown;
}

export type CreateLessonRequest = Record<string, unknown>;
export type UpdateLessonRequest = Record<string, unknown>;

export interface LessonNote {
    id: string;
    content?: string;
    text?: string;
    studentId?: string;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LessonFacade {
    constructor(private readonly api: ApiService) { }

    getAllLessons(): Observable<LessonReadDto[]> {
        return extractData(this.api.get<unknown>('/api/Lessons'), []).pipe(map(asArray<LessonReadDto>));
    }

    getLessonById(id: string): Observable<LessonReadDto | null> {
        return extractData(this.api.get<unknown>(`/api/Lessons/${id}`), null);
    }

    getCourseLessons(courseId: string): Observable<LessonReadDto[]> {
        return extractData(
            this.api.get<unknown>('/api/Lessons', {
                CourseId: courseId,
                PageNumber: 1,
                PageSize: 1000,
            }),
            [],
        ).pipe(map(asArray<LessonReadDto>));
    }

    createLesson(payload: CreateLessonRequest): Observable<LessonReadDto | null> {
        return extractData(this.api.post<unknown>('/api/Lessons', payload), null);
    }

    updateLesson(id: string, payload: UpdateLessonRequest): Observable<LessonReadDto | null> {
        return extractData(this.api.put<unknown>(`/api/Lessons/${id}`, payload), null);
    }

    deleteLesson(id: string): Observable<boolean> {
        return this.api.delete<unknown>(`/api/Lessons/${id}`).pipe(map(() => true));
    }

    saveProgress(_lessonId: string, payload: { completed: boolean; currentTime?: number; lessonId?: string; progress?: number }): Observable<unknown> {
        return of(payload);
    }

    getNotes(lessonId: string): Observable<LessonNote[]> {
        return extractData(this.api.get<unknown>(`/api/StudentNotes/by-lesson/${lessonId}`), []).pipe(map(asArray<LessonNote>));
    }

    addNote(lessonId: string, studentId: string, text: string): Observable<LessonNote | null> {
        return extractData(this.api.post<unknown>('/api/StudentNotes', {
            lessonId,
            studentId,
            text,
            timestamp: Date.now(),
        }), null);
    }

    deleteNote(noteId: string): Observable<boolean> {
        return this.api.delete<unknown>(`/api/StudentNotes/${noteId}`).pipe(map(() => true));
    }
}

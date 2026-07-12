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
    contentUrl?: string;
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
    lessonId?: string;
    content?: string;
    text?: string;
    timestamp?: number | string;
    studentId?: string;
    createdAt?: string;
}

export interface UpdateStudentNotePayload {
    text: string;
    timestamp: number;
}

export interface CreateStudentQuestionPayload {
    studentId: string;
    lessonId: string;
    questionText: string;
    timestamp: number;
}

export interface SubmitLessonFeedbackPayload {
    lessonId: string;
    rating: number;
    comment?: string | null;
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

    getNotesByStudent(studentId: string): Observable<LessonNote[]> {
        return extractData(this.api.get<unknown>(`/api/StudentNotes/by-student/${studentId}`), []).pipe(map(asArray<LessonNote>));
    }

    addNote(lessonId: string, studentId: string, text: string, timestamp: number): Observable<LessonNote | null> {
        return extractData(this.api.post<unknown>('/api/StudentNotes', {
            lessonId,
            studentId,
            text,
            timestamp,
        }), null);
    }

    createStudentQuestion(payload: CreateStudentQuestionPayload): Observable<boolean> {
        return this.api.post<unknown>('/api/StudentQuestions', payload).pipe(map(() => true));
    }

    submitFeedback(payload: SubmitLessonFeedbackPayload): Observable<boolean> {
        return this.api.post<unknown>('/api/LessonFeedback', payload).pipe(map(() => true));
    }

    updateNote(noteId: string, payload: UpdateStudentNotePayload): Observable<boolean> {
        return this.api.put<unknown>(`/api/StudentNotes/${noteId}`, payload).pipe(map(() => true));
    }

    deleteNote(noteId: string): Observable<boolean> {
        return this.api.delete<unknown>(`/api/StudentNotes/${noteId}`).pipe(map(() => true));
    }
}

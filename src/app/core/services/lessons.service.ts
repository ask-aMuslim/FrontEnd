import { Injectable, inject } from '@angular/core';
import { Observable, catchError, filter, map, of, switchMap, take } from 'rxjs';
import { LessonFacade, LessonReadDto, CreateLessonRequest, UpdateLessonRequest } from '../../api/facades/lesson.facade';
import { Id } from '../models/interfaces/base.model';
import { StudentFacade } from '../../api/facades/student.facade';
import { StudentProfile } from '../models/interfaces/student-profile.model';

/**
 * Service to handle all lesson-related API calls
 * Provides CRUD operations and additional lesson functionality
 * Now uses generated type-safe API clients
 */
@Injectable({ providedIn: 'root' })
export class LessonsService {
  private readonly facade = inject(LessonFacade);
  private readonly studentFacade = inject(StudentFacade);

  /**
   * Get all lessons
   */
  getAll(): Observable<LessonReadDto[]> {
    return this.facade.getAllLessons();
  }

  /**
   * Get lesson by ID with full content details
   */
  getById(id: Id): Observable<LessonReadDto | null> {
    return this.facade.getLessonById(String(id));
  }

  /**
   * Get lessons by course ID
   */
  getByCourseId(courseId: Id): Observable<LessonReadDto[]> {
    return this.facade.getCourseLessons(String(courseId));
  }

  /**
   * Create a new lesson
   */
  create(payload: CreateLessonRequest): Observable<boolean> {
    return this.facade.createLesson(payload).pipe(
      map(lesson => lesson !== null)
    );
  }

  /**
   * Update an existing lesson
   */
  update(id: Id, payload: UpdateLessonRequest): Observable<boolean> {
    return this.facade.updateLesson(String(id), payload).pipe(
      map(lesson => lesson !== null)
    );
  }

  /**
   * Delete a lesson
   */
  delete(id: Id): Observable<boolean> {
    return this.facade.deleteLesson(String(id));
  }

  /**
   * Save lesson progress for current student
   * Note: Backend endpoint not verified - placeholder implementation
   */
  saveProgress(lessonId: Id, progress: { completed: boolean; currentTime?: number }): Observable<void> {
    return this.facade.saveProgress(String(lessonId), {
      lessonId: String(lessonId),
      progress: progress.currentTime ?? 0,
      completed: progress.completed
    }).pipe(
      map(() => void 0)
    );
  }

  /**
   * Get student notes for a lesson
   * Note: Backend endpoint not verified - placeholder implementation
   */
  getNotes(lessonId: Id): Observable<Array<{ id: Id; timestamp: string; text: string; createdAt: string }>> {
    return this.facade.getNotes(String(lessonId)).pipe(
      map(notes => notes.map(note => ({
        id: note.id,
        timestamp: '', // Note: LessonNote doesn't have timestamp
        text: note.text ?? note.content ?? '',
        createdAt: note.createdAt
      })))
    );
  }

  /**
   * Add a note to a lesson
   * Note: Backend endpoint not verified - placeholder implementation
   */
  addNote(lessonId: Id, note: { timestamp: string; text: string }): Observable<{ id: Id; timestamp: string; text: string; createdAt: string } | null> {
    return this.studentFacade.me().pipe(
      filter((profile): profile is StudentProfile & { studentId: string } => typeof profile?.studentId === 'string' && profile.studentId.length > 0),
      take(1),
      switchMap((profile) => this.facade.addNote(String(lessonId), profile.studentId, note.text)),
      map(result => result ? {
        id: result.id,
        timestamp: note.timestamp,
        text: result.text ?? result.content ?? note.text,
        createdAt: result.createdAt
      } : null),
      catchError(() => of(null))
    );
  }

  /**
   * Delete a note
   * Note: Backend endpoint not verified - placeholder implementation
   */
  deleteNote(noteId: Id): Observable<void> {
    return this.facade.deleteNote(String(noteId)).pipe(
      map(() => void 0)
    );
  }
}

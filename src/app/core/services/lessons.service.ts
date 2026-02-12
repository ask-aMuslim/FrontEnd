import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { LessonReadDto } from '../api/generated/models';
import { Id } from '../models/interfaces/base.model';
import { LessonFacade } from '../api/facades/lesson.facade';

/**
 * Service to handle all lesson-related API calls
 * Provides CRUD operations and additional lesson functionality
 * Now uses generated type-safe API clients
 */
@Injectable({ providedIn: 'root' })
export class LessonsService {
  private facade = inject(LessonFacade);

  /**
   * Get all lessons
   */
  getAll(): Observable<LessonReadDto[]> {
    return this.facade.getAllLessons();
  }

  /**
   * Get lesson by ID with full content details
   */
  getById(id: Id): Observable<LessonReadDto> {
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
  create(payload: { Title: string; CourseId: string; Content?: string; ExternalVideoUrl?: string; body?: { Thumbnail?: Blob; Video?: Blob } }): Observable<LessonReadDto> {
    return this.facade.createLesson(payload);
  }

  /**
   * Update an existing lesson
   */
  update(id: Id, payload: { Title: string; Content?: string; ExternalVideoUrl?: string; body?: { Thumbnail?: Blob; Video?: Blob } }): Observable<void> {
    return this.facade.updateLesson(String(id), payload);
  }

  /**
   * Delete a lesson
   */
  delete(id: Id): Observable<void> {
    return this.facade.deleteLesson(String(id));
  }

  /**
   * Save lesson progress for current student
   */
  saveProgress(lessonId: Id, progress: { completed: boolean; currentTime?: number }): Observable<void> {
    return this.facade.saveProgress(String(lessonId), progress);
  }

  /**
   * Get student notes for a lesson
   */
  getNotes(lessonId: Id): Observable<Array<{ id: Id; timestamp: string; text: string; createdAt: string }>> {
    // Cast strict type from facade to service specific type if needed
    return this.facade.getNotes(String(lessonId)) as Observable<Array<{ id: Id; timestamp: string; text: string; createdAt: string }>>;
  }

  /**
   * Add a note to a lesson
   */
  addNote(lessonId: Id, note: { timestamp: string; text: string }): Observable<{ id: Id; timestamp: string; text: string; createdAt: string }> {
    return this.facade.addNote(String(lessonId), note) as Observable<{ id: Id; timestamp: string; text: string; createdAt: string }>;
  }

  /**
   * Delete a note
   */
  deleteNote(noteId: Id): Observable<void> {
    return this.facade.deleteNote(String(noteId));
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, catchError, filter, map, of, switchMap, take } from 'rxjs';
import {
  LessonFacade,
  LessonReadDto,
  CreateLessonRequest,
  UpdateLessonRequest,
  LessonNote,
} from '../../api/facades/lesson.facade';
import { Id } from '../models/interfaces/base.model';
import { StudentFacade } from '../../api/facades/student.facade';
import { StudentProfile } from '../models/interfaces/student-profile.model';

export interface LessonNoteSummary {
  id: Id;
  timestamp: string;
  progressSeconds: number;
  text: string;
  createdAt: string;
}

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
   */
  getNotes(lessonId: Id): Observable<LessonNoteSummary[]> {
    return this.facade.getNotes(String(lessonId)).pipe(
      map(notes => notes.map(note => ({
        id: note.id,
        timestamp: this.formatProgressTime(this.toProgressSeconds(note)),
        progressSeconds: this.toProgressSeconds(note),
        text: note.text ?? note.content ?? '',
        createdAt: this.normalizeCreatedAt(note.createdAt)
      })))
    );
  }

  /**
   * Add a note to a lesson
   */
  addNote(
    lessonId: Id,
    note: { timestampSeconds: number; text: string },
  ): Observable<LessonNoteSummary | null> {
    return this.studentFacade.me().pipe(
      filter((profile): profile is StudentProfile & { studentId: string } => typeof profile?.studentId === 'string' && profile.studentId.length > 0),
      take(1),
      switchMap((profile) =>
        this.facade.addNote(
          String(lessonId),
          profile.studentId,
          note.text,
          Math.max(0, note.timestampSeconds),
        ),
      ),
      map(result => result ? {
        id: result.id,
        timestamp: this.formatProgressTime(this.toProgressSeconds(result, note.timestampSeconds)),
        progressSeconds: this.toProgressSeconds(result, note.timestampSeconds),
        text: result.text ?? result.content ?? note.text,
        createdAt: this.normalizeCreatedAt(result.createdAt)
      } : null),
      catchError(() => of(null))
    );
  }

  /**
   * Delete a note
   */
  deleteNote(noteId: Id): Observable<void> {
    return this.facade.deleteNote(String(noteId)).pipe(
      map(() => void 0)
    );
  }

  private toProgressSeconds(note: LessonNote, fallbackSeconds = 0): number {
    const candidate = note.timestamp;
    let numericValue = Number.NaN;
    if (typeof candidate === 'number') {
      numericValue = candidate;
    } else if (typeof candidate === 'string') {
      numericValue = Number.parseFloat(candidate);
    }

    if (Number.isFinite(numericValue) && numericValue >= 0) {
      if (numericValue <= 86_400) {
        return numericValue;
      }

      // Backward compatibility for legacy notes created with epoch milliseconds.
      if (numericValue > 1_000_000_000) {
        return fallbackSeconds;
      }

      return numericValue;
    }

    return Math.max(0, fallbackSeconds);
  }

  private formatProgressTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    if (hours > 0) {
      return `[Lesson] ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `[Lesson] ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private normalizeCreatedAt(createdAt: string | undefined): string {
    return typeof createdAt === 'string' && createdAt.trim().length > 0
      ? createdAt
      : new Date().toISOString();
  }
}

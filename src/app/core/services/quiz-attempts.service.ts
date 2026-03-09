import { Injectable } from '@angular/core';
import { Observable, catchError, filter, map, of, switchMap, take } from 'rxjs';
import { QuizAttemptFacade } from '../../api/facades/quiz-attempt.facade';
import { StudentFacade } from '../../api/facades/student.facade';
import { StudentProfile } from '../models/interfaces/student-profile.model';
import { QuizAnswerDto } from '../../api/models/quiz-answer-dto';
import {
  CreateQuizAttemptRequest,
  QuizAttemptDto,
} from '../models/interfaces/quiz-attempt.model';

/**
 * Domain service for quiz attempt CRUD operations.
 *
 * Uses typed facade access for /api/QuizAttempts endpoints.
 */
@Injectable({ providedIn: 'root' })
export class QuizAttemptsService {
  constructor(
    private readonly facade: QuizAttemptFacade,
    private readonly studentFacade: StudentFacade,
  ) { }

  getByQuiz(quizId: string): Observable<QuizAttemptDto[]> {
    return this.facade.getAttemptsByQuiz(quizId).pipe(map((attempts) => attempts.map((attempt) => this.mapAttempt(attempt))));
  }

  getByStudent(studentId: string): Observable<QuizAttemptDto[]> {
    return this.facade.getAttemptsByStudent(studentId).pipe(map((attempts) => attempts.map((attempt) => this.mapAttempt(attempt))));
  }

  startAttempt(request: CreateQuizAttemptRequest): Observable<string | null> {
    return this.facade.startAttempt({
      quizId: String(request.quizId),
      studentId: String(request.studentId),
    });
  }

  startAttemptForQuiz(quizId: string): Observable<string | null> {
    return this.studentFacade.me().pipe(
      filter((profile): profile is StudentProfile & { studentId: string } => typeof profile?.studentId === 'string' && profile.studentId.length > 0),
      take(1),
      switchMap((profile) => this.startAttempt({
        quizId,
        studentId: profile.studentId,
      })),
      catchError(() => of(null)),
    );
  }

  completeAttempt(attemptId: string, answers: QuizAnswerDto[]): Observable<boolean> {
    return this.facade.completeAttempt(attemptId, { answers });
  }

  private mapAttempt(attempt: Record<string, unknown>): QuizAttemptDto {
    return {
      id: this.asString(attempt['id']),
      quizId: this.asString(attempt['quizId']),
      studentId: this.asString(attempt['studentId']),
      score: typeof attempt['score'] === 'number' ? attempt['score'] : undefined,
      isPassed: typeof attempt['isPassed'] === 'boolean' ? attempt['isPassed'] : undefined,
      startedAt: typeof attempt['startedAt'] === 'string' ? attempt['startedAt'] : undefined,
      completedAt: typeof attempt['completedAt'] === 'string' ? attempt['completedAt'] : undefined,
      attemptNumber: typeof attempt['attemptNumber'] === 'number' ? attempt['attemptNumber'] : undefined,
    };
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * Domain service for quiz attempt CRUD operations.
 *
 * IMPORTANT: QuizAttempts endpoints (/api/QuizAttempts/*) are NOT exposed
 * in the Swagger spec (swagger.json) and therefore have no generated API
 * functions or facades. This service intentionally stays on the legacy
 * ApiService until the backend publishes QuizAttempts in the spec.
 *
 * Related but separate: QuizEvaluationFacade handles server-side quiz
 * evaluation triggers at /api/QuizEvaluation/evaluate/*.
 */
@Injectable({ providedIn: 'root' })
export class QuizAttemptsService {
  private static readonly QUIZ_ATTEMPTS_PATH = '/api/QuizAttempts';

  constructor(private readonly api: ApiService) { }

  getByQuiz(quizId: string): Observable<unknown> {
    return this.api.get<unknown>(`${QuizAttemptsService.QUIZ_ATTEMPTS_PATH}/by-quiz/${quizId}`);
  }

  getByStudent(studentId: string): Observable<unknown> {
    return this.api.get<unknown>(`${QuizAttemptsService.QUIZ_ATTEMPTS_PATH}/by-student/${studentId}`);
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post<unknown>(QuizAttemptsService.QUIZ_ATTEMPTS_PATH, payload);
  }

  complete(attemptId: string, payload: unknown): Observable<unknown> {
    return this.api.put<unknown>(`${QuizAttemptsService.QUIZ_ATTEMPTS_PATH}/complete/${attemptId}`, payload);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class QuizAttemptsService {
  constructor(private api: ApiService) {}

  getByQuiz(quizId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.quizAttempts.getByQuiz(quizId));
  }

  getByStudent(studentId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.quizAttempts.getByStudent(studentId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.quizAttempts.create(), payload);
  }

  complete(attemptId: string, payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.quizAttempts.complete(attemptId), payload);
  }
}

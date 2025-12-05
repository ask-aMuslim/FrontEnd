import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class StudentQuestionsService {
  constructor(private api: ApiService) {}

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.studentQuestions.getById(id));
  }

  delete(id: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.studentQuestions.delete(id));
  }

  getByLesson(lessonId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.studentQuestions.getByLesson(lessonId));
  }

  getByStudent(studentId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.studentQuestions.getByStudent(studentId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.studentQuestions.create(), payload);
  }

  answer(id: string, payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.studentQuestions.answer(id), payload);
  }
}

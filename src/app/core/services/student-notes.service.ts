import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class StudentNotesService {
  constructor(private api: ApiService) {}

  getById(id: string): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.studentNotes.getById(id));
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete(API_ENDPOINTS.studentNotes.delete(id));
  }

  getByLesson(lessonId: string): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.studentNotes.getByLesson(lessonId));
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.studentNotes.create(), payload);
  }
}

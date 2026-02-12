import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  constructor(private api: ApiService) { }

  getAll(): Observable<unknown> {
    return this.api.get<unknown>(API_ENDPOINTS.questions.getAll());
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.questions.create(), payload);
  }

  getById(id: string): Observable<unknown> {
    return this.api.get<unknown>(API_ENDPOINTS.questions.getById(id));
  }

  update(id: string, payload: unknown): Observable<unknown> {
    return this.api.put<unknown>(API_ENDPOINTS.questions.update(id), payload);
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete<unknown>(API_ENDPOINTS.questions.delete(id));
  }
}

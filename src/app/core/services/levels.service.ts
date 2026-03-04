import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class LevelsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.levels.getAll());
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.levels.create(), payload);
  }

  getById(id: string): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.levels.getById(id));
  }

  update(id: string, payload: unknown): Observable<unknown> {
    return this.api.put(API_ENDPOINTS.levels.update(id), payload);
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete(API_ENDPOINTS.levels.delete(id));
  }
}

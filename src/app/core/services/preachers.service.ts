import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class PreachersService {
  constructor(private api: ApiService) {}

  me(): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.preachers.me());
  }

  getById(userId: string): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.preachers.getById(userId));
  }

  getAll(): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.preachers.getAll());
  }

  update(payload: unknown): Observable<unknown> {
    return this.api.put(API_ENDPOINTS.preachers.update(), payload);
  }
}

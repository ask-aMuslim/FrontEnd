import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class EventsService {
  constructor(private api: ApiService) { }

  getAll(): Observable<unknown> {
    return this.api.get<unknown>(API_ENDPOINTS.events.getAll());
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.events.create(), payload);
  }

  getById(id: string): Observable<unknown> {
    return this.api.get<unknown>(API_ENDPOINTS.events.getById(id));
  }

  update(id: string, payload: unknown): Observable<unknown> {
    return this.api.put<unknown>(API_ENDPOINTS.events.update(id), payload);
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete<unknown>(API_ENDPOINTS.events.delete(id));
  }
}

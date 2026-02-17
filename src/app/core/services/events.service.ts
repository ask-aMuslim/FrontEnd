import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private static readonly EVENTS_PATH = '/api/Events';

  constructor(private api: ApiService) { }

  getAll(): Observable<unknown> {
    return this.api.get<unknown>(EventsService.EVENTS_PATH);
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post<unknown>(EventsService.EVENTS_PATH, payload);
  }

  getById(id: string): Observable<unknown> {
    return this.api.get<unknown>(`${EventsService.EVENTS_PATH}/${encodeURIComponent(id)}`);
  }

  update(id: string, payload: unknown): Observable<unknown> {
    return this.api.put<unknown>(`${EventsService.EVENTS_PATH}/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete<unknown>(`${EventsService.EVENTS_PATH}/${encodeURIComponent(id)}`);
  }
}

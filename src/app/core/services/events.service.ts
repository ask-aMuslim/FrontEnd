import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private static readonly EVENTS_PATH = '/api/Events';

  constructor(private api: ApiService) { }

  getAll(params?: { pageNumber?: number; pageSize?: number }): Observable<unknown> {
    const query = this.buildQueryString(params);
    const url = query ? `${EventsService.EVENTS_PATH}?${query}` : EventsService.EVENTS_PATH;
    return this.api.get<unknown>(url);
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

  private buildQueryString(params?: { pageNumber?: number; pageSize?: number }): string {
    if (!params) return '';
    const parts: string[] = [];
    if (params.pageNumber !== undefined) parts.push(`pageNumber=${params.pageNumber}`);
    if (params.pageSize !== undefined) parts.push(`pageSize=${params.pageSize}`);
    return parts.join('&');
  }
}

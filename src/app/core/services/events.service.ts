import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { EventStatus } from '../../pages/events/event-status.enum';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private static readonly EVENTS_PATH = '/api/Events';

  private readonly api = inject(ApiService);

  getAll(params?: {
    pageNumber?: number;
    pageSize?: number;
    isPublished?: boolean;
    eventStatus?: EventStatus;
    searchTerm?: string;
  }): Observable<unknown> {
    const query = this.buildQueryString({ isPublished: true, ...params });
    const url = query ? `${EventsService.EVENTS_PATH}?${query}` : EventsService.EVENTS_PATH;
    return this.api.get<unknown>(url);
  }

  getNext(): Observable<unknown> {
    return this.api.get<unknown>(`${EventsService.EVENTS_PATH}/next`);
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

  private buildQueryString(params?: {
    pageNumber?: number;
    pageSize?: number;
    isPublished?: boolean;
    eventStatus?: EventStatus;
    searchTerm?: string;
  }): string {
    if (!params) return '';
    const parts: string[] = [];
    if (params.isPublished !== undefined) parts.push(`IsPublished=${params.isPublished}`);
    if (params.eventStatus !== undefined) parts.push(`EventStatus=${params.eventStatus}`);
    if (params.searchTerm) parts.push(`SearchTerm=${encodeURIComponent(params.searchTerm)}`);
    if (params.pageNumber !== undefined) parts.push(`PageNumber=${params.pageNumber}`);
    if (params.pageSize !== undefined) parts.push(`PageSize=${params.pageSize}`);
    return parts.join('&');
  }
}

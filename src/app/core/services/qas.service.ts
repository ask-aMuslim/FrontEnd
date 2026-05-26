import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class QasService {
  private static readonly QAS_PATH = '/api/QAs';

  constructor(private api: ApiService) { }

  getAll(params?: {
    pageNumber?: number;
    pageSize?: number;
    tags?: string | string[];
    tagIds?: string | string[];
    isPublished?: boolean;
    searchTerm?: string;
  }): Observable<unknown> {
    const query = this.buildQueryString(params);
    const url = query ? `${QasService.QAS_PATH}?${query}` : QasService.QAS_PATH;
    return this.api.get<unknown>(url);
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post<unknown>(QasService.QAS_PATH, payload);
  }

  getById(id: string): Observable<unknown> {
    return this.api.get<unknown>(`${QasService.QAS_PATH}/${id}`);
  }

  update(id: string, payload: unknown): Observable<unknown> {
    return this.api.put<unknown>(`${QasService.QAS_PATH}/${id}`, payload);
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete<unknown>(`${QasService.QAS_PATH}/${id}`);
  }

  private buildQueryString(params?: {
    pageNumber?: number;
    pageSize?: number;
    tags?: string | string[];
    tagIds?: string | string[];
    isPublished?: boolean;
    searchTerm?: string;
  }): string {
    if (!params) return '';
    const parts: string[] = [];
    if (params.pageNumber !== undefined) parts.push(`pageNumber=${params.pageNumber}`);
    if (params.pageSize !== undefined) parts.push(`pageSize=${params.pageSize}`);
    if (params.isPublished !== undefined) parts.push(`isPublished=${params.isPublished}`);
    if (params.searchTerm !== undefined && params.searchTerm !== null) {
      parts.push(`searchTerm=${encodeURIComponent(params.searchTerm)}`);
    }

    if (params.tags !== undefined) {
      if (Array.isArray(params.tags)) {
        for (const tag of params.tags) {
          parts.push(`tags=${encodeURIComponent(tag)}`);
        }
      } else {
        parts.push(`tags=${encodeURIComponent(params.tags)}`);
      }
    }

    if (params.tagIds !== undefined) {
      if (Array.isArray(params.tagIds)) {
        for (const tagId of params.tagIds) {
          parts.push(`tagIds=${encodeURIComponent(tagId)}`);
        }
      } else {
        parts.push(`tagIds=${encodeURIComponent(params.tagIds)}`);
      }
    }

    return parts.join('&');
  }
}

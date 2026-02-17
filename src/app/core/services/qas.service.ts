import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class QasService {
  private static readonly QAS_PATH = '/api/QAs';

  constructor(private api: ApiService) { }

  getAll(): Observable<unknown> {
    return this.api.get<unknown>(QasService.QAS_PATH);
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
}

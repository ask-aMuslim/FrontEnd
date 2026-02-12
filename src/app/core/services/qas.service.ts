import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class QasService {
  constructor(private api: ApiService) { }

  getAll(): Observable<unknown> {
    return this.api.get<unknown>(API_ENDPOINTS.qas.getAll());
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post<unknown>(API_ENDPOINTS.qas.create(), payload);
  }

  getById(id: string): Observable<unknown> {
    return this.api.get<unknown>(API_ENDPOINTS.qas.getById(id));
  }

  update(id: string, payload: unknown): Observable<unknown> {
    return this.api.put<unknown>(API_ENDPOINTS.qas.update(id), payload);
  }

  delete(id: string): Observable<unknown> {
    return this.api.delete<unknown>(API_ENDPOINTS.qas.delete(id));
  }
}

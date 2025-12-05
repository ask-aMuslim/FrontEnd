import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class TagsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<any> {
    return this.api.get(API_ENDPOINTS.tags.getAll());
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.tags.create(), payload);
  }

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.tags.getById(id));
  }

  update(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.tags.update(id), payload);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.tags.delete(id));
  }
}

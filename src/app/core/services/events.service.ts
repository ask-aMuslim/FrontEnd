import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class EventsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<any> {
    return this.api.get(API_ENDPOINTS.events.getAll());
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.events.create(), payload);
  }

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.events.getById(id));
  }

  update(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.events.update(id), payload);
  }

  delete(id: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.events.delete(id));
  }
}

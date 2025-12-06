import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class EventRegistrationsService {
  constructor(private api: ApiService) {}

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.eventRegistrations.getById(id));
  }

  delete(id: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.eventRegistrations.delete(id));
  }

  getByEvent(eventId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.eventRegistrations.getByEvent(eventId));
  }

  getByUser(userId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.eventRegistrations.getByUser(userId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.eventRegistrations.create(), payload);
  }

  updateStatus(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.eventRegistrations.updateStatus(id), payload);
  }
}

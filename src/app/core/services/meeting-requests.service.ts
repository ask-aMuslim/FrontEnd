import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class MeetingRequestsService {
  constructor(private api: ApiService) {}

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.meetingRequests.getById(id));
  }

  getByRequester(requesterId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.meetingRequests.getByRequester(requesterId));
  }

  getByScholar(scholarId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.meetingRequests.getByScholar(scholarId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.meetingRequests.create(), payload);
  }

  updateStatus(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.meetingRequests.updateStatus(id), payload);
  }

  updateResponse(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.meetingRequests.updateResponse(id), payload);
  }
}

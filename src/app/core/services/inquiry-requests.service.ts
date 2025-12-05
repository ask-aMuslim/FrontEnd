import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class InquiryRequestsService {
  constructor(private api: ApiService) {}

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.inquiryRequests.getById(id));
  }

  getByRequester(requesterId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.inquiryRequests.getByRequester(requesterId));
  }

  getByScholar(scholarId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.inquiryRequests.getByScholar(scholarId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.inquiryRequests.create(), payload);
  }

  updateStatus(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.inquiryRequests.updateStatus(id), payload);
  }

  updateResponse(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.inquiryRequests.updateResponse(id), payload);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AssignInquiryRequestCommand,
  CreateInquiryRequestCommand,
  UpdateInquiryRequestResponseCommand,
  UpdateInquiryRequestStatusCommand,
} from '../../api/models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class InquiryRequestsService {
  private static readonly INQUIRY_REQUESTS_PATH = '/api/InquiryRequests';

  constructor(private readonly api: ApiService) { }

  getById(id: string): Observable<unknown> {
    return this.api.get(`${InquiryRequestsService.INQUIRY_REQUESTS_PATH}/${id}`);
  }

  getByRequester(requesterId: string): Observable<unknown> {
    return this.api.get(`${InquiryRequestsService.INQUIRY_REQUESTS_PATH}/by-requester/${requesterId}`);
  }

  getByModerator(moderatorId: string): Observable<unknown> {
    return this.api.get(`${InquiryRequestsService.INQUIRY_REQUESTS_PATH}/by-moderator/${moderatorId}`);
  }

  create(payload: CreateInquiryRequestCommand): Observable<unknown> {
    return this.api.post(InquiryRequestsService.INQUIRY_REQUESTS_PATH, payload);
  }

  updateStatus(id: string, payload: UpdateInquiryRequestStatusCommand): Observable<unknown> {
    return this.api.put(`${InquiryRequestsService.INQUIRY_REQUESTS_PATH}/${id}/status`, payload);
  }

  updateResponse(id: string, payload: UpdateInquiryRequestResponseCommand): Observable<unknown> {
    return this.api.put(`${InquiryRequestsService.INQUIRY_REQUESTS_PATH}/${id}/response`, payload);
  }

  assign(id: string, payload: AssignInquiryRequestCommand): Observable<unknown> {
    return this.api.put(`${InquiryRequestsService.INQUIRY_REQUESTS_PATH}/${id}/assign`, payload);
  }
}

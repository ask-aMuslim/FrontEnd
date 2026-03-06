import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AssignMeetingRequestCommand,
  CreateMeetingRequestCommand,
  UpdateMeetingRequestResponseCommand,
  UpdateMeetingRequestStatusCommand,
} from '../../api/models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MeetingRequestsService {
  private static readonly MEETING_REQUESTS_PATH = '/api/MeetingRequests';

  constructor(private readonly api: ApiService) { }

  getById(id: string): Observable<unknown> {
    return this.api.get(`${MeetingRequestsService.MEETING_REQUESTS_PATH}/${id}`);
  }

  getByRequester(requesterId: string): Observable<unknown> {
    return this.api.get(`${MeetingRequestsService.MEETING_REQUESTS_PATH}/by-requester/${requesterId}`);
  }

  getByModerator(moderatorId: string): Observable<unknown> {
    return this.api.get(`${MeetingRequestsService.MEETING_REQUESTS_PATH}/by-moderator/${moderatorId}`);
  }

  create(payload: CreateMeetingRequestCommand): Observable<unknown> {
    return this.api.post(MeetingRequestsService.MEETING_REQUESTS_PATH, payload);
  }

  updateStatus(id: string, payload: UpdateMeetingRequestStatusCommand): Observable<unknown> {
    return this.api.put(`${MeetingRequestsService.MEETING_REQUESTS_PATH}/${id}/status`, payload);
  }

  updateResponse(id: string, payload: UpdateMeetingRequestResponseCommand): Observable<unknown> {
    return this.api.put(`${MeetingRequestsService.MEETING_REQUESTS_PATH}/${id}/response`, payload);
  }

  assign(id: string, payload: AssignMeetingRequestCommand): Observable<unknown> {
    return this.api.put(`${MeetingRequestsService.MEETING_REQUESTS_PATH}/${id}/assign`, payload);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateEventRegistrationPayload {
  eventId: string;
}

export interface ParkQuestionPayload {
  eventRegistrationId: string;
  questionText: string;
}

export enum EventRegistrationStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Cancelled = 4,
}

export interface EventRegistrationMyStatusData {
  isRegistered: boolean;
  questionText: string | null;
  eventRegistrationStatus: EventRegistrationStatus;
  eventRegistrationId?: string | null;
}

export interface ApiResponse<T> {
  succeeded: boolean;
  errors: string[];
  data: T | null;
}

@Injectable({ providedIn: 'root' })
export class EventRegistrationsService {
  private static readonly EVENT_REGISTRATIONS_PATH = '/api/EventRegistrations';
  private static readonly MY_STATUS_PATH = '/api/EventRegistrations/my-status';
  private static readonly PARK_QUESTION_PATH = '/api/EventRegistrations/park-question';

  private readonly api = inject(ApiService);

  create(payload: CreateEventRegistrationPayload): Observable<unknown> {
    return this.api.post<unknown>(EventRegistrationsService.EVENT_REGISTRATIONS_PATH, payload);
  }

  getMyStatus(eventId: string): Observable<ApiResponse<EventRegistrationMyStatusData>> {
    return this.api.get<ApiResponse<EventRegistrationMyStatusData>>(
      `${EventRegistrationsService.MY_STATUS_PATH}/${eventId}`,
    );
  }

  parkQuestion(payload: ParkQuestionPayload): Observable<unknown> {
    return this.api.put<unknown>(EventRegistrationsService.PARK_QUESTION_PATH, payload);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AdminNotesService {
  constructor(private api: ApiService) {}

  getByStudent(studentId: string): Observable<unknown> {
    return this.api.get(API_ENDPOINTS.adminNotes.getByStudent(studentId));
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.adminNotes.create(), payload);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  constructor(private api: ApiService) {}

  getById(id: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.enrollments.getById(id));
  }

  delete(id: string): Observable<any> {
    return this.api.delete(API_ENDPOINTS.enrollments.delete(id));
  }

  getByCourse(courseId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.enrollments.getByCourse(courseId));
  }

  getByStudent(studentId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.enrollments.getByStudent(studentId));
  }

  create(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.enrollments.create(), payload);
  }

  updateStatus(id: string, payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.enrollments.updateStatus(id), payload);
  }
}

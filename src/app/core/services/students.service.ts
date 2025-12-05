import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class StudentsService {
  constructor(private api: ApiService) {}

  me(): Observable<any> {
    return this.api.get(API_ENDPOINTS.students.me());
  }

  getById(userId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.students.getById(userId));
  }

  getAll(): Observable<any> {
    return this.api.get(API_ENDPOINTS.students.getAll());
  }

  dashboard(): Observable<any> {
    return this.api.get(API_ENDPOINTS.students.dashboard());
  }

  update(payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.students.update(), payload);
  }
}

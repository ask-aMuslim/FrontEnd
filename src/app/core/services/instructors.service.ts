import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class InstructorsService {
  constructor(private api: ApiService) {}

  me(): Observable<any> {
    return this.api.get(API_ENDPOINTS.instructors.me());
  }

  getById(userId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.instructors.getById(userId));
  }

  getAll(): Observable<any> {
    return this.api.get(API_ENDPOINTS.instructors.getAll());
  }

  update(payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.instructors.update(), payload);
  }
}

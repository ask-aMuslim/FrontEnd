import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class PreachersService {
  constructor(private api: ApiService) {}

  me(): Observable<any> {
    return this.api.get(API_ENDPOINTS.preachers.me());
  }

  getById(userId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.preachers.getById(userId));
  }

  getAll(): Observable<any> {
    return this.api.get(API_ENDPOINTS.preachers.getAll());
  }

  update(payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.preachers.update(), payload);
  }
}

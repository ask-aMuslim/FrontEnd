import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AdminsService {
  constructor(private api: ApiService) {}

  me(): Observable<any> {
    return this.api.get(API_ENDPOINTS.admins.me());
  }

  getById(userId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.admins.getById(userId));
  }

  update(payload: any): Observable<any> {
    return this.api.put(API_ENDPOINTS.admins.update(), payload);
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private api: ApiService) {}

  getByUser(userId: string): Observable<any> {
    return this.api.get(API_ENDPOINTS.notifications.getByUser(userId));
  }

  send(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.notifications.send(), payload);
  }

  markRead(notificationId: string): Observable<any> {
    return this.api.post(API_ENDPOINTS.notifications.markRead(notificationId), {});
  }
}

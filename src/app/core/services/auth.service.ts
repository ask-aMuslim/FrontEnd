import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService) {}

  register(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.auth.register(), payload);
  }

  login(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.auth.login(), payload);
  }

  loginGoogle(token: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.auth.loginGoogle(), { token });
  }

  loginFacebook(payload: any): Observable<any> {
    return this.api.post(API_ENDPOINTS.auth.loginFacebook(), payload);
  }
}

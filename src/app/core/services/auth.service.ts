import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Reactive authentication state using signals
  private _isAuthenticated = signal<boolean>(false);
  private _currentUser = signal<{ name: string; meta: string } | null>(null);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

  constructor(private api: ApiService) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    if (!this.isBrowser) return;

    // Check localStorage for existing auth token/state
    const mockAuth = localStorage.getItem('mockAuth');
    if (mockAuth === 'true') {
      this._isAuthenticated.set(true);
      this._currentUser.set({
        name: 'Noah Michael',
        meta: 'Course A2 - lesson 2'
      });
    }
  }

  setAuthState(isAuthenticated: boolean, user?: { name: string; meta: string }): void {
    this._isAuthenticated.set(isAuthenticated);
    this._currentUser.set(user || null);

    if (!this.isBrowser) return;

    if (isAuthenticated) {
      localStorage.setItem('mockAuth', 'true');
    } else {
      localStorage.removeItem('mockAuth');
    }
  }

  logout(): void {
    this.setAuthState(false);
  }

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

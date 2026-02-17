import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, throwError } from 'rxjs';
import { ApiConfiguration } from '../api-configuration';
import { forgotPassword, login, register, resetPassword, verifyOtp } from '../functions';
import { LoginCommand, RegisterCommand } from '../models';

export type UserRole = 'Student' | 'Instructor' | 'Admin' | 'NonMuslim';

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface LoginResponse {
  token?: string;
  expiresIn?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: number;
  userId?: string;
}

interface ApiEnvelope<T> {
  data?: T | null;
  errors?: string[];
}

@Injectable({ providedIn: 'root' })
export class IdentityFacade {
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly config: ApiConfiguration
  ) { }

  clearError(): void {
    this.error.set(null);
  }

  register(payload: RegistrationData): Observable<void> {
    let role: 1 | 2 | 3 | 4 | 5 = 2; // Default to Student (2)
    if (payload.role === 'Student') {
      role = 2;
    } else if (payload.role === 'Instructor') {
      role = 3;
    } else if (payload.role === 'Admin') {
      role = 1;
    } else if (payload.role === 'NonMuslim') {
      role = 5;
    }

    const body: RegisterCommand = {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role,
    };

    return this.withRequestState(
      register(this.http, this.config.rootUrl, { body }).pipe(map(() => void 0))
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginCommand = { email, password };

    return this.withRequestState(
      login(this.http, this.config.rootUrl, { body }).pipe(
        map((response) => {
          const payload = response.body as ApiEnvelope<LoginResponse> | null;
          return payload?.data ?? {};
        })
      )
    );
  }

  logout(): void {
    this.clearError();
  }

  requestPasswordResetOtp(email: string): Observable<void> {
    return this.withRequestState(
      forgotPassword(this.http, this.config.rootUrl, { body: { email } }).pipe(map(() => void 0))
    );
  }

  verifyPasswordResetOtp(email: string, otp: string): Observable<void> {
    return this.withRequestState(
      verifyOtp(this.http, this.config.rootUrl, { body: { email, otp } }).pipe(map(() => void 0))
    );
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<void> {
    return this.withRequestState(
      resetPassword(this.http, this.config.rootUrl, {
        body: { email, otp, newPassword },
      }).pipe(map(() => void 0))
    );
  }

  private withRequestState<T>(request$: Observable<T>): Observable<T> {
    this.isLoading.set(true);
    this.error.set(null);

    return request$.pipe(
      catchError((error: unknown) => {
        this.error.set(this.resolveErrorMessage(error));
        return throwError(() => error);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const nested = (error as { error?: unknown }).error;
      if (nested && typeof nested === 'object' && 'message' in nested) {
        const message = (nested as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return 'Request failed. Please try again.';
  }
}

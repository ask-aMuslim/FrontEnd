import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, throwError } from 'rxjs';
import { ApiConfiguration } from '../api-configuration';
import {
  forgotPassword,
  login,
  loginWithFacebook,
  loginWithGoogle,
  logout as authLogout,
  register,
  resetPassword,
  verifyOtp,
} from '../functions';
import {
  LoginCommand,
  LoginWithFacebookCommand,
  LoginWithGoogleCommand,
  RegisterCommand,
  ReligiousStatus,
  Result,
} from '../models';
import { TokenService } from '../../core/auth/token.service';
import { ResultOfAuthenticationResponse } from '../models/result-of-authentication-response';

export type UserRole = 'Student' | 'Instructor' | 'Admin' | 'NonMuslim';

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  religiousStatus: ReligiousStatus;
  role?: UserRole;
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

interface VerifyOtpTokenPayload {
  token?: string | null;
  data?: string | {
    token?: string | null;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class IdentityFacade {
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly config: ApiConfiguration,
    private readonly tokenService: TokenService,
  ) { }

  clearError(): void {
    this.error.set(null);
  }

  register(payload: RegistrationData): Observable<void> {
    const body: RegisterCommand = {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: 2,
      religion: payload.religiousStatus,
    };

    return this.withRequestState(
      register(this.http, this.config.rootUrl, { body }).pipe(
        map(() => void 0),
      ),
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginCommand = { email, password };

    return this.withRequestState(
      login(this.http, this.config.rootUrl, { body }).pipe(
        map((response) =>
          this.mapAuthenticationResponse(
            response.body as ResultOfAuthenticationResponse | null,
          ),
        ),
      ),
    );
  }

  loginGoogle(idToken: string): Observable<LoginResponse> {
    const body: LoginWithGoogleCommand = { idToken };

    return this.withRequestState(
      loginWithGoogle(this.http, this.config.rootUrl, { body }).pipe(
        map((response) =>
          this.mapAuthenticationResponse(
            response.body as ResultOfAuthenticationResponse | null,
          ),
        ),
      ),
    );
  }

  loginFacebook(accessToken: string): Observable<LoginResponse> {
    const body: LoginWithFacebookCommand = { accessToken };

    return this.withRequestState(
      loginWithFacebook(this.http, this.config.rootUrl, { body }).pipe(
        map((response) =>
          this.mapAuthenticationResponse(
            response.body as ResultOfAuthenticationResponse | null,
          ),
        ),
      ),
    );
  }

  logout(): Observable<void> {
    return this.withRequestState(
      authLogout(this.http, this.config.rootUrl).pipe(
        map(() => void 0),
        finalize(() => this.tokenService.clearTokens()),
      ),
    );
  }

  requestPasswordResetOtp(email: string): Observable<void> {
    return this.withRequestState(
      forgotPassword(this.http, this.config.rootUrl, { body: { email } }).pipe(
        map(() => void 0),
      ),
    );
  }

  verifyPasswordResetOtp(email: string, otp: string): Observable<string> {
    return this.withRequestState(
      verifyOtp(this.http, this.config.rootUrl, { body: { email, otp } }).pipe(map((response) => {
        const responseBody = response.body as Result & VerifyOtpTokenPayload;
        const tokenFromData = typeof responseBody?.data === 'string'
          ? responseBody.data
          : responseBody?.data?.token;
        const token = responseBody?.token ?? tokenFromData;

        if (!token || token.trim().length === 0) {
          throw new Error('Verification token was not returned by the server.');
        }

        return token;
      })),
    );
  }

  resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Observable<void> {
    return this.withRequestState(
      resetPassword(this.http, this.config.rootUrl, {
        body: { email, token, newPassword },
      }).pipe(map(() => void 0)),
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
      finalize(() => this.isLoading.set(false)),
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

  private mapAuthenticationResponse(
    envelope: ResultOfAuthenticationResponse | null,
  ): LoginResponse {
    const data = envelope?.data ?? {};

    if (data.token) {
      const expiresAt = data.expiresAt
        ? new Date(data.expiresAt).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
      const expiresIn = Math.max(
        60,
        Math.floor((expiresAt - Date.now()) / 1000),
      );

      this.tokenService.setTokens({
        accessToken: data.token,
        refreshToken: '',
        expiresIn,
        userId: data.userId ?? undefined,
        userEmail: data.email ?? undefined,
      });
    }

    return {
      token: data.token,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      userId: data.userId,
    } as LoginResponse;
  }
}

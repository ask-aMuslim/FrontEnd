import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface SocialAuthResponse {
    token: string;
    user: {
        id?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        [key: string]: unknown;
    };
}

export interface GoogleIdTokenPayload {
    idToken: string;
}

export interface FacebookAccessTokenPayload {
    accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class SocialAuthFacade {
    private readonly http = inject(HttpClient);

    /**
     * Login with Google ID Token
     */
    loginWithGoogle(idToken: string): Observable<SocialAuthResponse> {
        if (!idToken || typeof idToken !== 'string') {
            return throwError(() => new Error('Invalid Google ID token provided'));
        }

        const payload: GoogleIdTokenPayload = { idToken };

        // use relative path to align with other facades and avoid duplicating apiBaseUrl prefix
        return this.http.post<SocialAuthResponse>(
            '/api/Authentication/login/google',
            payload
        ).pipe(
            tap((response) => this.validateResponse(response)),
            catchError((error) => this.handleError(error, 'Google login'))
        );
    }

    /**
     * Login with Facebook Access Token
     */
    loginWithFacebook(accessToken: string): Observable<SocialAuthResponse> {
        if (!accessToken || typeof accessToken !== 'string') {
            return throwError(() => new Error('Invalid Facebook access token provided'));
        }

        const payload: FacebookAccessTokenPayload = { accessToken };

        return this.http.post<SocialAuthResponse>(
            '/api/Authentication/login/facebook',
            payload
        ).pipe(
            tap((response) => this.validateResponse(response)),
            catchError((error) => this.handleError(error, 'Facebook login'))
        );
    }

    private validateResponse(response: SocialAuthResponse | null): void {
        if (!response?.token) {
            throw new Error('Invalid response from authentication server');
        }
    }

    private handleError(error: unknown, context: string): Observable<never> {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`${context} failed:`, errorMessage);
        return throwError(() => new Error(`${context} failed: ${errorMessage}`));
    }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiConfiguration } from '../api-configuration';
import { loginWithGoogle, loginWithFacebook } from '../functions';

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

@Injectable({ providedIn: 'root' })
export class SocialAuthFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);

    /**
     * Login with Google ID Token
     */
    loginWithGoogle(idToken: string): Observable<SocialAuthResponse> {
        if (!idToken || typeof idToken !== 'string') {
            return throwError(() => new Error('Invalid Google ID token provided'));
        }

        console.log('Google ID Token to be sent to backend:', idToken);

        return loginWithGoogle(this.http, this.config.rootUrl, { body: { idToken } }).pipe(
            map(response => this.mapToSocialAuthResponse(response.body)),
            tap(mappedResponse => this.validateResponse(mappedResponse)),
            catchError(error => this.handleError(error, 'Google login'))
        );
    }

    /**
     * Login with Facebook Access Token
     */
    loginWithFacebook(accessToken: string): Observable<SocialAuthResponse> {
        if (!accessToken || typeof accessToken !== 'string') {
            return throwError(() => new Error('Invalid Facebook access token provided'));
        }

        return loginWithFacebook(this.http, this.config.rootUrl, { body: { accessToken } }).pipe(
            map(response => this.mapToSocialAuthResponse(response.body)),
            tap(mappedResponse => this.validateResponse(mappedResponse)),
            catchError(error => this.handleError(error, 'Facebook login'))
        );
    }

    private mapToSocialAuthResponse(body: any): SocialAuthResponse {
        return {
            token: body?.data?.token || '',
            user: {
                id: body?.data?.id,
                email: body?.data?.email,
                firstName: body?.data?.firstName,
                lastName: body?.data?.lastName,
            }
        };
    }

    private validateResponse(response: SocialAuthResponse | null): void {
        if (!response?.token) {
            throw new Error('Invalid response from authentication server');
        }
    }

    private handleError(error: unknown, context: string): Observable<never> {
        let errorMessage = 'Unknown error occurred';
        if (error instanceof HttpErrorResponse) {
            console.error(`${context} Backend Error:`, error.error);
            errorMessage = error.error?.message || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error(`${context} failed:`, errorMessage);
        return throwError(() => new Error(`${context} failed: ${errorMessage}`));
    }
}

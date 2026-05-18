import { Injectable, inject } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Observable, from, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { IdentityFacade, LoginResponse } from '../../api/facades/identity.facade';

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
export class SocialAuthenticationService {
    private readonly socialAuthService = inject(SocialAuthService);
    private readonly identityFacade = inject(IdentityFacade);

    /**
     * Authenticate user with Google
     */
    signInWithGoogle(): Observable<SocialAuthResponse> {
        return from(this.socialAuthService.signIn('GOOGLE')).pipe(
            switchMap((user: SocialUser) => {
                const idToken = user?.idToken;
                if (!idToken) {
                    return throwError(() => new Error('No ID token received from Google'));
                }
                return this.handleGoogleToken(idToken);
            })
        );
    }

    handleGoogleToken(idToken: string): Observable<SocialAuthResponse> {
        return this.identityFacade.loginGoogle(idToken).pipe(
            map(response => this.mapToSocialAuthResponse(response))
        );
    }

    /**
     * Authenticate user with Facebook
     */
    signInWithFacebook(): Observable<SocialAuthResponse> {
        return from(this.socialAuthService.signIn('FACEBOOK')).pipe(
            switchMap((user) => {
                const socialUser = user as unknown as { accessToken?: string; idToken?: string; response?: { accessToken: string } };
                const accessToken = socialUser?.accessToken || socialUser?.response?.accessToken || socialUser?.idToken;
                if (!accessToken) {
                    return throwError(() => new Error('No access token received from Facebook'));
                }
                return this.identityFacade.loginFacebook(accessToken).pipe(
                    map(response => this.mapToSocialAuthResponse(response))
                );
            })
        );
    }

    private mapToSocialAuthResponse(response: LoginResponse): SocialAuthResponse {
        return {
            token: response.token ?? '',
            user: {
                id: response.userId,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName
            }
        };
    }

    signOut(): Observable<void> {
        return from(this.socialAuthService.signOut());
    }
}

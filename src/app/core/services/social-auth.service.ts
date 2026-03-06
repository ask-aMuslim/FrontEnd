import { Injectable, inject } from '@angular/core';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { Observable, from, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SocialAuthFacade, SocialAuthResponse } from '../../api/facades/social-auth.facade';

@Injectable({ providedIn: 'root' })
export class SocialAuthenticationService {
    private readonly socialAuthService = inject(SocialAuthService);
    private readonly socialAuthFacade = inject(SocialAuthFacade);

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
                return this.socialAuthFacade.loginWithGoogle(idToken);
            }),
            switchMap((response) => this.storeSessionToken(response))
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
                return this.socialAuthFacade.loginWithFacebook(accessToken);
            }),
            switchMap((response) => this.storeSessionToken(response))
        );
    }

    private storeSessionToken(response: SocialAuthResponse | null): Observable<SocialAuthResponse> {
        try {
            if (response?.token) {
                sessionStorage.setItem('auth_token', response.token);
            }
            return from(Promise.resolve(response || { token: '', user: {} }));
        } catch (error) {
            return throwError(() => new Error(`Failed to store session token: ${error}`));
        }
    }

    signOut(): Observable<void> {
        return from(this.socialAuthService.signOut());
    }
}

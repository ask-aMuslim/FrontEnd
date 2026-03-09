import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { SocialAuthServiceConfig, SOCIAL_AUTH_CONFIG, GoogleLoginProvider, FacebookLoginProvider } from '@abacritt/angularx-social-login';

import { routes } from './app.routes';
import { provideApiConfiguration } from './api/api-configuration';
import { environment } from '../environments/environment';

// Interceptors
import { authInterceptor } from './core/http/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/http/interceptors/loading.interceptor';
import { errorInterceptor } from './core/http/interceptors/error.interceptor';

export const getSocialAuthConfig = (): SocialAuthServiceConfig => {
  const googleClientId = environment.googleClientId;
  const facebookAppId = environment.facebookAppId;

  return {
    onError: (err: unknown) => console.error('Social Auth Error:', err),
    providers: [
      {
        id: 'GOOGLE',
        provider: new GoogleLoginProvider(googleClientId),
      },
      {
        id: 'FACEBOOK',
        provider: new FacebookLoginProvider(facebookAppId),
      },
    ],
  };
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    // HTTP client with functional interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        // Order matters: auth first (adds token), loading state around all calls, then error handling
        authInterceptor,
        loadingInterceptor,
        errorInterceptor
      ])
    ),

    // Configure generated API clients with base URL from environment
    provideApiConfiguration(environment.apiBaseUrl),

    // Social Auth Configuration
    {
      provide: SOCIAL_AUTH_CONFIG,
      useFactory: getSocialAuthConfig,
    },
  ],
};

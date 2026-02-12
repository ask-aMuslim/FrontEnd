import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';


import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideApiConfiguration } from './core/api/generated/api-configuration';
import { environment } from '../environments/environment';

// Interceptors
import { authInterceptor } from './core/http/interceptors/auth.interceptor';
import { errorInterceptor } from './core/http/interceptors/error.interceptor';

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
    provideClientHydration(withEventReplay()),
    // HTTP client with functional interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        // Order matters: auth first (adds token), then error handling
        authInterceptor,
        errorInterceptor
      ])
    ),

    // Configure generated API clients with base URL from environment
    provideApiConfiguration(environment.apiBaseUrl),
  ],
};

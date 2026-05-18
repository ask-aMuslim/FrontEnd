// This file is required by the Angular CLI for unit tests
// It imports Zone.js for testing

import 'zone.js';
import 'zone.js/testing';

// Initialize the test environment
import { getTestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { of } from 'rxjs';
import {
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
    { teardown: { destroyAfterEach: true } },
);

const socialAuthServiceMock: Partial<SocialAuthService> = {
    authState: of({} as SocialUser),
    initState: of(true),
    signIn: () => Promise.reject(new Error('Not implemented in unit tests')),
    signOut: () => Promise.resolve(),
};

const jasmineBeforeEach = (globalThis as { beforeEach?: (fn: () => void) => void }).beforeEach;

jasmineBeforeEach?.(() => {
    getTestBed().configureTestingModule({
        providers: [
            provideRouter([]),
            provideHttpClient(),
            provideHttpClientTesting(),
            { provide: SocialAuthService, useValue: socialAuthServiceMock },
        ],
    });
});

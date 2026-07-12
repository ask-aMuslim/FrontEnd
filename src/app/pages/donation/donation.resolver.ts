import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { GlobalLoadingService } from '../../core/services/global-loading.service';

export const donationResolver: ResolveFn<string> = () => {
  const platformId = inject(PLATFORM_ID);
  const loadingService = inject(GlobalLoadingService);
  const donationUrl = 'https://www.zeffy.com/embed/donation-form/donate-to-change-lives-14179';

  if (!isPlatformBrowser(platformId)) {
    return of(donationUrl);
  }

  // Start the global page loading screen while resolving/fetching the Zeffy portal
  loadingService.start();

  // 1. Establish DNS preconnect for Zeffy's servers
  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://www.zeffy.com';
  preconnect.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect);

  // 2. Return an Observable that blocks the route transition until the portal is fully loaded
  return new Observable<string>((observer) => {
    const iframe = document.createElement('iframe');
    iframe.src = donationUrl;
    
    // Hide the preloading iframe completely from layout and screen readers
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');

    let isResolved = false;

    // Timeout fallback of 6 seconds to ensure page displays even if the user has connection issues
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        observer.next(donationUrl);
        observer.complete();
      }
    }, 6000);

    const onLoad = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        cleanup();
        observer.next(donationUrl);
        observer.complete();
      }
    };

    const cleanup = () => {
      // Stop the global page loading screen
      loadingService.stop();

      iframe.removeEventListener('load', onLoad);
      iframe.removeEventListener('error', onLoad);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    iframe.addEventListener('load', onLoad);
    iframe.addEventListener('error', onLoad); // Handle failure gracefully to avoid blocking navigation

    document.body.appendChild(iframe);
  });
};

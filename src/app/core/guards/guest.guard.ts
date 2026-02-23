import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (tokenService.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};

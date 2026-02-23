import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    if (state.url.startsWith('/academy')) {
      return true;
    }

    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (tokenService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

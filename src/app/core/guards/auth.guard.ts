import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

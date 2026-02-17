import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../auth/token.service';

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};

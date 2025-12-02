import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  router.navigate(['/login']);
  return false;
};

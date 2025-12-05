import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { catchError, switchMap, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const access = localStorage.getItem('access');
  let authReq = req;

  // Ajout du token si présent
  if (access) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${access}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si 401 → essayer refresh token
      if (error.status === 401) {
        return auth.refresh().pipe(
          switchMap(() => {
            const newAccess = localStorage.getItem('access');
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newAccess}` },
            });
            return next(retryReq);
          }),
          catchError((err) => {
            // Si refresh échoue → logout
            auth.logout();
            return throwError(() => err);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, throwError } from 'rxjs';
import { AuthRecoveryService } from '@pdz/core/services/auth-recovery.service';

export const authRecoveryInterceptor: HttpInterceptorFn = (req, next) => {
  const recovery = inject(AuthRecoveryService);

  return next(req).pipe(
    catchError((error) => {
      if (!recovery.isDeadTokenError(error)) return throwError(() => error);
      if (!recovery.recover()) return throwError(() => error);
      return EMPTY;
    }),
  );
};

import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth0.service';

export type UserRole = 'owner' | 'admin' | 'dev';

export interface Me {
  sub: string;
  username?: string;
  roles: UserRole[];
  joined: string;
  lastLogin: string;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly me$: Observable<Me | null> = this.auth.isAuthenticated$.pipe(
    switchMap((isAuthenticated) =>
      isAuthenticated
        ? this.apiService
            .get<Me>('users/me', {
              errorHandlingOptions: { suppressErrorReporting: true },
            })
            .pipe(catchError(() => of(null)))
        : of(null),
    ),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  readonly roles$: Observable<UserRole[]> = this.me$.pipe(
    map((me) => me?.roles ?? []),
  );

  readonly isAdmin$: Observable<boolean> = this.roles$.pipe(
    map((roles) => roles.includes('admin') || roles.includes('owner')),
  );

  hasRole$(...roles: UserRole[]): Observable<boolean> {
    return this.roles$.pipe(
      map((userRoles) => roles.some((role) => userRoles.includes(role))),
    );
  }
}

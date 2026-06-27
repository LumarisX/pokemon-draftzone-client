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

/**
 * Exposes the current user's roles (from the authoritative `users` collection
 * via `GET /users/me`). The result is cached for the session.
 *
 * Note: this is for UX only (showing/hiding admin UI). All admin endpoints are
 * independently enforced on the server, so a forged client role grants nothing.
 */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);

  /** The current user, or null when signed out / unavailable. */
  readonly me$: Observable<Me | null> = this.auth.isAuthenticated$.pipe(
    switchMap((isAuthenticated) =>
      isAuthenticated
        ? this.apiService
            .get<Me>('users/me', {
              authenticated: true,
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

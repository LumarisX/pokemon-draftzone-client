import { inject, Injectable } from '@angular/core';
import {
  catchError,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth0.service';
import { Settings } from '@pdz/layout/top-navbar/settings.service';

export type UserRole = 'owner' | 'admin' | 'dev' | 'tournament-creator';

export interface MeProfile {
  discordName: string | null;
  gameName: string | null;
  timezone: string | null;
}

export interface Me {
  sub: string;
  profileId: string | null;
  displayName: string;
  profile: MeProfile;
  privateProfile: boolean;
  roles: UserRole[];
  settings: Settings;
  joined: string;
  lastLogin: string;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly replaced$ = new Subject<Me | null>();

  private fetchMe(): Observable<Me | null> {
    return this.apiService
      .get<Me>('users/me', {
        errorHandlingOptions: { suppressErrorReporting: true },
      })
      .pipe(catchError(() => of(null)));
  }

  readonly me$: Observable<Me | null> = merge(
    this.auth.isAuthenticated$.pipe(
      switchMap((isAuthenticated) =>
        isAuthenticated ? this.fetchMe() : of(null),
      ),
    ),
    this.replaced$,
  ).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  readonly roles$: Observable<UserRole[]> = this.me$.pipe(
    map((me) => me?.roles ?? []),
  );

  readonly isAdmin$: Observable<boolean> = this.roles$.pipe(
    map((roles) => roles.includes('admin') || roles.includes('owner')),
  );

  setMe(me: Me): void {
    this.replaced$.next(me);
  }

  reload(): Observable<Me | null> {
    return this.fetchMe().pipe(tap((me) => this.replaced$.next(me)));
  }

  hasRole$(...roles: UserRole[]): Observable<boolean> {
    return this.roles$.pipe(
      map((userRoles) => roles.some((role) => userRoles.includes(role))),
    );
  }
}

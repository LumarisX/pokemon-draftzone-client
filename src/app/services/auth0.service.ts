import { Injectable, inject } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { catchError, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { Settings } from '../pages/settings/settings.service';

export type LeagueRole = 'owner' | 'coach' | 'helper' | 'player' | 'spectator';

export type LeagueRoles = {
  [leagueId: string]: LeagueRole;
};

type AppUser = User & {
  username: string;
  settings: Settings;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0 = inject<Auth0Service<AppUser>>(Auth0Service);

  public readonly user$: Observable<AppUser | null>;
  public readonly isAuthenticated$: Observable<boolean>;
  public readonly accessToken$: Observable<string | undefined>;

  constructor() {
    this.isAuthenticated$ = this.auth0.isAuthenticated$.pipe(shareReplay(1));

    this.user$ = this.auth0.user$.pipe(
      map((user) => (user as AppUser) || null),
      shareReplay(1),
    );

    this.accessToken$ = this.isAuthenticated$.pipe(
      switchMap((isAuthenticated) =>
        isAuthenticated ? this.auth0.getAccessTokenSilently() : of(undefined),
      ),
      catchError((error) => {
        console.error('Error getting access token silently:', error);
        this.login();
        return of(undefined);
      }),
      shareReplay(1),
    );
  }

  public login(): void {
    this.auth0.loginWithRedirect();
  }

  public logout(): void {
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }

  public getLeagueRoles(): Observable<LeagueRoles> {
    return of({ pdbls2: 'coach', fdl: 'spectator' });
  }
}

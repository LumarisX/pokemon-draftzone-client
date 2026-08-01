import { inject, Injectable } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { Settings } from '@pdz/layout/top-navbar/settings.service';
import { map, Observable, of, shareReplay } from 'rxjs';

export type LeagueRole = 'owner' | 'coach' | 'helper' | 'player' | 'spectator';

export type LeagueRoles = {
  [tournamentSlug: string]: LeagueRole;
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

  public readonly user$ = this.auth0.user$.pipe(
    map((user) => (user as AppUser) || null),
    shareReplay(1),
  );
  public readonly isAuthenticated$ = this.auth0.isAuthenticated$.pipe(
    shareReplay(1),
  );

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

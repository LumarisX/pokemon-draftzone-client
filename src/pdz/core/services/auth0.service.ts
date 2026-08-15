import { inject, Injectable } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { Settings } from '@pdz/layout/top-navbar/settings.service';
import { map, shareReplay } from 'rxjs';

export type LeagueRole = 'owner' | 'coach' | 'helper' | 'player' | 'spectator';

type AppUser = User & {
  username: string;
  settings: Settings;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0 = inject(Auth0Service);

  public readonly user$ = this.auth0.user$.pipe(
    map((user) => (user as AppUser) || null),
    shareReplay(1),
  );
  public readonly isAuthenticated$ = this.auth0.isAuthenticated$.pipe(
    shareReplay(1),
  );

  public login(target?: string): void {
    this.auth0.loginWithRedirect({
      appState: {
        target: target ?? window.location.pathname + window.location.search,
      },
    });
  }

  public logout(): void {
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }
}

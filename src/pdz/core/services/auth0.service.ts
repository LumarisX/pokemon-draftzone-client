import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { AccountDataService } from '@pdz/core/services/account-data.service';
import { filter, firstValueFrom, map, shareReplay } from 'rxjs';

export type LeagueRole = 'owner' | 'coach' | 'helper' | 'player' | 'spectator';

type AppUser = User & {
  username: string;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0 = inject(Auth0Service);
  private router = inject(Router);
  private accountData = inject(AccountDataService);

  constructor() {
    this.auth0.appState$
      .pipe(
        map((state) => (state as { target?: string } | undefined)?.target),
        filter((target): target is string => !!target),
      )
      .subscribe((target) => {
        this.router.navigateByUrl(target, { replaceUrl: true });
      });
  }

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

  public async logout(): Promise<void> {
    const user = await firstValueFrom(this.auth0.user$, { defaultValue: null });
    const cleared = await this.accountData.clearForLogout(user?.sub ?? null);
    if (!cleared) return;
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }
}

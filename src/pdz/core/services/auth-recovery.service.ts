import { inject, Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { filter, switchMap, take } from 'rxjs';

const DEAD_TOKEN_ERRORS = new Set([
  'invalid_grant',
  'missing_refresh_token',
  'login_required',
  'consent_required',
]);

const RECOVERY_KEY = 'pdz.auth-recovery-at';
const RECOVERY_COOLDOWN_MS = 60_000;

@Injectable({
  providedIn: 'root',
})
export class AuthRecoveryService {
  private auth = inject(AuthService);
  private recovering = false;

  isDeadTokenError(error: unknown): boolean {
    return (
      !!error &&
      typeof error === 'object' &&
      DEAD_TOKEN_ERRORS.has((error as { error?: string }).error ?? '')
    );
  }

  recover(): boolean {
    if (this.recovering) return true;
    if (this.recoveredRecently()) return false;

    this.recovering = true;
    this.markRecovery();

    this.auth
      .logout({ openUrl: false })
      .pipe(
        switchMap(() =>
          this.auth.loginWithRedirect({
            appState: {
              target: window.location.pathname + window.location.search,
            },
          }),
        ),
      )
      .subscribe();

    return true;
  }

  validateSessionOnStartup(): void {
    this.auth.isLoading$
      .pipe(
        filter((isLoading) => !isLoading),
        take(1),
        switchMap(() => this.auth.isAuthenticated$.pipe(take(1))),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.auth.getAccessTokenSilently()),
      )
      .subscribe({
        error: (error) => {
          if (this.isDeadTokenError(error)) this.recover();
        },
      });
  }

  private recoveredRecently(): boolean {
    try {
      const last = Number(sessionStorage.getItem(RECOVERY_KEY) ?? 0);
      return Date.now() - last < RECOVERY_COOLDOWN_MS;
    } catch {
      return false;
    }
  }

  private markRecovery(): void {
    try {
      sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
    } catch {}
  }
}

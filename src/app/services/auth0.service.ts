import { Injectable } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { catchError, Observable, of, tap } from 'rxjs';
import { Settings } from '../pages/settings/settings.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private accessToken: string | null = null;

  constructor(private auth0: Auth0Service) {}

  setAccessToken() {
    this.auth0
      .getAccessTokenSilently()
      .pipe(
        tap((token) => {
          if (token) {
            localStorage.setItem('access_token', token);
          }
        }),
        catchError((error) => {
          if (
            error.error === 'missing_refresh_token' ||
            error.error === 'login_required' ||
            error.error === 'consent_required' ||
            error.error === 'invalid_grant'
          ) {
            // If the token is invalid or expired, prompt the user to log in again
            this.login();
          } else {
            console.error('Failed to get access token:', error);
          }
          return of(null);
        }),
      )
      .subscribe();
  }

  getAccessToken(): Observable<string | null> {
    if (this.accessToken) {
      return of(this.accessToken);
    }
    return this.auth0.getAccessTokenSilently().pipe(
      tap((token) => (this.accessToken = token)),
      catchError((error) => this.handleTokenError(error)),
    );
  }

  removeAccessToken(): void {
    localStorage.removeItem('access_token');
  }

  login() {
    this.auth0
      .loginWithPopup()
      .pipe(
        tap(() => {
          this.setAccessToken();
          window.location.reload();
        }),
        catchError((error) => {
          console.error('Login failed:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  logout() {
    this.auth0
      .logout({
        logoutParams: {},
      })
      .subscribe(() => {
        this.removeAccessToken();
        this.accessToken = null;
      });
  }

  isAuthenticated() {
    return this.auth0.isAuthenticated$;
  }

  user() {
    return this.auth0.user$ as Observable<
      (User & { username: string; settings: Settings }) | null | undefined
    >;
  }

  private handleTokenError(error: any): Observable<string | null> {
    if (
      error?.error === 'missing_refresh_token' ||
      error?.error === 'login_required' ||
      error?.error === 'consent_required' ||
      error?.error === 'invalid_grant'
    ) {
      this.login();
    } else {
      console.error('Failed to get access token:', error);
    }
    return of(null);
  }
}

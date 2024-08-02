import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { catchError, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth0: Auth0Service, private router: Router) {}

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
        })
      )
      .subscribe();
  }

  // Method to get the access token from localStorage
  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently().pipe(
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
        return of(''); // Return an empty string observable to handle the error
      })
    );
  }

  // Method to remove the access token from localStorage
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
        })
      )
      .subscribe();
  }

  logout() {
    this.auth0
      .logout({
        logoutParams: {},
      })
      .pipe(
        tap(() => {
          this.removeAccessToken();
        })
      )
      .subscribe();
  }

  isAuthenticated() {
    return this.auth0.isAuthenticated$;
  }

  user() {
    return this.auth0.user$;
  }
}

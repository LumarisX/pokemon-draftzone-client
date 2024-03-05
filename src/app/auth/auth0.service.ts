import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth0: Auth0Service) {}

  setAccessToken() {
    this.auth0.getAccessTokenSilently().subscribe((token) => {
      if (token) {
        localStorage.setItem('access_token', token);
      }
    });
  }

  // Method to get the access token from localStorage
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Method to remove the access token from localStorage
  removeAccessToken(): void {
    localStorage.removeItem('access_token');
  }

  login() {
    this.auth0.loginWithPopup().subscribe((response) => {
      this.setAccessToken();
    });
  }

  logout() {
    this.auth0
      .logout({
        logoutParams: {},
      })
      .subscribe((response) => {
        this.removeAccessToken();
      });
  }

  isAuthenticated(): Observable<boolean> {
    return this.auth0.isAuthenticated$.pipe(
      tap((loggedIn) => {
        if (loggedIn) {
          this.setAccessToken();
        }
      })
    );
  }

  user() {
    return this.auth0.user$;
  }
}

import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';

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
  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
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

  isAuthenticated() {
    return this.auth0.isAuthenticated$;
  }

  user() {
    return this.auth0.user$;
  }
}

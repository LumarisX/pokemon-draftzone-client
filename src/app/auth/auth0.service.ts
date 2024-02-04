import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
  providedIn: 'root',
})
export class Auth0Service {
  constructor(private auth: AuthService) {}

  getAccessToken() {
    this.auth.getAccessTokenSilently().subscribe((data) => {
      return data;
    });
  }
}

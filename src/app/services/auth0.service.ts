import { Injectable, OnDestroy } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  Subscription,
  filter,
  switchMap,
  tap,
} from 'rxjs';
import { Settings } from '../pages/settings/settings.service';
interface AppUser extends User {
  username: string;
  settings: Settings;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  public _userSubject = new BehaviorSubject<AppUser | null | undefined>(
    undefined,
  );
  public user$ = this._userSubject.asObservable();
  private userSubscription!: Subscription;
  private _accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this._accessTokenSubject.asObservable();

  private accessTokenSubscription!: Subscription;
  constructor(
    private auth0: Auth0Service<{ username: string; settings: Settings }>,
  ) {
    this.setupUserStream();
    this.setupAccessTokenStream();
  }

  private setupUserStream(): void {
    this.userSubscription = this.auth0.user$
      .pipe(
        filter((user) => user !== undefined),
        switchMap((auth0User) => {
          return of(auth0User);
        }),
        tap((user) => {
          this._userSubject.next(user as AppUser | null);
        }),
      )
      .subscribe(
        () => {},
        (error) => console.error('Error in user stream:', error),
      );
  }

  user(): Observable<AppUser | null | undefined> {
    return this.user$;
  }

  isAuthenticated(): Observable<boolean> {
    return this.auth0.isAuthenticated$;
  }

  private setupAccessTokenStream(): void {
    this.accessTokenSubscription = this.auth0
      .getAccessTokenSilently()
      .pipe(
        tap((token) => {
          this._accessTokenSubject.next(token);
          if (token) {
            localStorage.setItem('access_token', token);
          } else {
            localStorage.removeItem('access_token');
          }
        }),
        catchError((error) => {
          this.handleTokenError(error);
          this._accessTokenSubject.next(null);
          return of(null);
        }),
      )
      .subscribe(
        () => {},
        (error) => console.error('Error in access token stream:', error),
      );
  }

  getAccessToken(): Observable<string | null> {
    return this.accessToken$;
  }

  removeAccessToken(): void {
    localStorage.removeItem('access_token');
    this._accessTokenSubject.next(null);
  }

  login(): void {
    this.auth0
      .loginWithPopup()
      .pipe(
        tap(() => {
          this.auth0.getAccessTokenSilently().subscribe({
            next: (token) => {
              if (token) {
                this._accessTokenSubject.next(token);
                localStorage.setItem('access_token', token);
              }
              window.location.reload();
            },
            error: (err) => {
              console.error('Failed to get token after login:', err);
              this._accessTokenSubject.next(null);
            },
          });
        }),
        catchError((error) => {
          console.error('Login failed:', error);
          return of(null);
        }),
      )
      .subscribe();
  }

  logout(): void {
    this.auth0
      .logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      })
      .subscribe(() => {
        this.removeAccessToken();
      });
  }

  private handleTokenError(error: any): void {
    if (
      error?.error === 'missing_refresh_token' ||
      error?.error === 'login_required' ||
      error?.error === 'consent_required' ||
      error?.error === 'invalid_grant'
    ) {
      console.warn('Token error, redirecting to login:', error?.error);
      this.login();
    } else {
      console.error('Failed to get access token:', error);
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.accessTokenSubscription) {
      this.accessTokenSubscription.unsubscribe();
    }
  }
}

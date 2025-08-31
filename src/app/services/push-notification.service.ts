import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private swPush = inject(SwPush);
  private auth = inject(AuthService);
  private apiService = inject(ApiService);

  private readonly VAPID_PUBLIC_KEY =
    'BF7k-hu06sdFW3xAFAdgn2xqgkunQeAhO7Z67Vf7PyN2NRLJ-HB45hMtGjFQflNrcUljP78l5zl1xO5foGBr4Hg';

  public subscribeToNotifications(): Observable<any> {
    if (!this.swPush.isEnabled) {
      console.warn('Service Worker not enabled for Push');
      return throwError(() => new Error('Service Worker not enabled'));
    }
    return this.auth.getAccessTokenSilently().pipe(
      catchError((err) =>
        throwError(() => new Error('Failed to get authentication token')),
      ),
      switchMap((token) => {
        if (!token) {
          return throwError(() => new Error('Authentication token is missing'));
        }
        return from(
          this.swPush.requestSubscription({
            serverPublicKey: this.VAPID_PUBLIC_KEY,
          }),
        ).pipe(map((subscription) => ({ token, subscription })));
      }),
      switchMap(({ token, subscription }) =>
        this.sendSubscriptionToBackend(subscription, token),
      ),
      tap(() => console.log('Subscription sent to backend successfully.')),
      catchError((err) => {
        console.error(
          'Could not subscribe to notifications or send to backend',
          err,
        );
        return throwError(() => err);
      }),
    );
  }

  private sendSubscriptionToBackend(
    subscription: PushSubscription,
    token: string,
  ): Observable<any> {
    return this.apiService.post('/push/subscribe', true, subscription).pipe(
      catchError((err) => {
        console.error('Failed to send subscription to backend:', err);
        // Handle specific errors (401, 403, etc.) if needed
        return throwError(() => err);
      }),
    );
  }

  // TODO: Implement unsubscribe logic
  // Unsubscribing should also ideally notify the backend (with auth token)
  // to remove the subscription from MongoDB. Create a protected DELETE /api/unsubscribe endpoint.
  // public unsubscribeFromNotifications()... { /* ... include token in backend call ... */ }
}

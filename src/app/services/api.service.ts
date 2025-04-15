import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  filter,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth0.service';
import { ErrorService } from '../error/error.service';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private serverUrl = `${environment.tls ? 'https' : 'http'}://${
    environment.apiUrl
  }`;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private errorService: ErrorService,
  ) {}

  private pendingRequests = new Map<string, Observable<any>>();

  //TODO: Remove any and make it required.
  get<T = any>(
    path: string | string[],
    authenticated: boolean,
    params: { [key: string]: string } = {},
    additionalHeaders: { [key: string]: string } = {},
  ): Observable<T> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...additionalHeaders,
    });
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const key = apiUrl + JSON.stringify(params);
    if (this.pendingRequests.has(key)) return this.pendingRequests.get(key)!;
    const request$ = (
      authenticated
        ? this.auth.getAccessToken().pipe(
            filter((token: string | null): token is string => !!token),
            switchMap((token: string) => {
              headers = headers.set('authorization', `Bearer ${token}`);
              return this.http.get<T>(`${this.serverUrl}/${apiUrl}`, {
                headers,
                params,
              });
            }),
          )
        : this.http.get<T>(`${this.serverUrl}/${apiUrl}`, { headers, params })
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorService.reportError(error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.pendingRequests.delete(key);
      }),
      shareReplay(1),
    );
    this.pendingRequests.set(key, request$);
    return request$;
  }

  //TODO: Remove any and make it required.
  post<T = any>(
    path: string | string[],
    authenticated: boolean,
    data: Object,
  ): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const request$ = (
      authenticated
        ? this.auth.getAccessToken().pipe(
            filter((token: string | null): token is string => !!token),
            switchMap((token: string) =>
              this.http.post<T>(`${this.serverUrl}/${apiUrl}`, data, {
                headers: new HttpHeaders({
                  'Content-Type': 'application/json',
                  authorization: `Bearer ${token}`,
                }),
              }),
            ),
          )
        : this.http.post<T>(`${this.serverUrl}/${apiUrl}`, data, {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
            }),
          })
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorService.reportError(error);
        return throwError(() => error);
      }),
    );
    return request$;
  }

  patch<T>(path: string | string[], data: any): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const request$ = this.auth.getAccessToken().pipe(
      filter((token: string | null): token is string => !!token),
      switchMap((token: string) =>
        this.http.patch<T>(`${this.serverUrl}/${apiUrl}`, data, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        }),
      ),
      catchError((error: HttpErrorResponse) => {
        this.errorService.reportError(error);
        return throwError(() => error);
      }),
    );
    return request$;
  }

  delete<T>(path: string | string[]): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const request$ = this.auth.getAccessToken().pipe(
      filter((token: string | null): token is string => !!token),
      switchMap((token: string) =>
        this.http.delete<T>(`${this.serverUrl}/${apiUrl}`, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        }),
      ),
      catchError((error: HttpErrorResponse) => {
        this.errorService.reportError(error);
        return throwError(() => error);
      }),
    );
    return request$;
  }
}

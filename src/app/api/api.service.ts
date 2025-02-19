import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth0.service';
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

  get(
    path: string | string[],
    authenticated: boolean,
    params: { [key: string]: string } = {},
  ): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (Array.isArray(path)) path = path.join('/');
    if (this.pendingRequests.has(path)) return this.pendingRequests.get(path)!;
    const request$ = (
      authenticated
        ? this.auth.getAccessToken().pipe(
            switchMap((token: string) => {
              headers = headers.set('authorization', `Bearer ${token}`);
              return this.http.get(`${this.serverUrl}/${path}`, {
                headers,
                params,
              });
            }),
          )
        : this.http.get(`${this.serverUrl}/${path}`, { headers, params })
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorService.reportError(error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.pendingRequests.delete(path + JSON.stringify(params));
      }),
      shareReplay(1),
    );
    this.pendingRequests.set(path + JSON.stringify(params), request$);
    return request$;
  }

  post(
    path: string | string[],
    authenticated: boolean,
    data: Object,
  ): Observable<any> {
    if (Array.isArray(path)) path = path.join('/');
    const request$ = (
      authenticated
        ? this.auth.getAccessToken().pipe(
            switchMap((token: string) =>
              this.http.post(`${this.serverUrl}/${path}`, data, {
                headers: new HttpHeaders({
                  'Content-Type': 'application/json',
                  authorization: `Bearer ${token}`,
                }),
              }),
            ),
          )
        : this.http.post(`${this.serverUrl}/${path}`, data, {
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

  patch(path: string | string[], data: any): Observable<any> {
    if (Array.isArray(path)) path = path.join('/');
    const request$ = this.auth.getAccessToken().pipe(
      switchMap((token: string) =>
        this.http.patch(`${this.serverUrl}/${path}`, data, {
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

  delete(path: string | string[]): Observable<any> {
    if (Array.isArray(path)) path = path.join('/');
    const request$ = this.auth.getAccessToken().pipe(
      switchMap((token: string) =>
        this.http.delete(`${this.serverUrl}/${path}`, {
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

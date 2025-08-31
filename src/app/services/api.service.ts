import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  catchError,
  filter,
  finalize,
  Observable,
  OperatorFunction,
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
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private errorService = inject(ErrorService);

  private serverUrl = `${environment.tls ? 'https' : 'http'}://${
    environment.apiUrl
  }`;

  private pendingRequests = new Map<string, Observable<any>>();

  //TODO: Remove any and make it required.
  get<T = any>(
    path: string | string[],
    authenticated: boolean,
    params:
      | HttpParams
      | {
          [param: string]:
            | string
            | number
            | boolean
            | ReadonlyArray<string | number | boolean>;
        } = {},
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
        ? this.authenticatedRequest<T>('GET', apiUrl, {
            params,
            additionalHeaders,
          })
        : this.http.get<T>(`${this.serverUrl}/${apiUrl}`, { headers, params })
    ).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      this.handleError(),
      finalize(() => {
        this.pendingRequests.delete(key);
      }),
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
        ? this.authenticatedRequest<T>('POST', apiUrl, { data })
        : this.http.post<T>(`${this.serverUrl}/${apiUrl}`, data, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
          })
    ).pipe(this.handleError());
    return request$;
  }

  patch<T>(path: string | string[], data: any): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const request$ = this.authenticatedRequest<T>('PATCH', apiUrl, {
      data,
    }).pipe(this.handleError());
    return request$;
  }

  delete<T>(path: string | string[]): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const request$ = this.authenticatedRequest<T>('DELETE', apiUrl).pipe(
      this.handleError(),
    );
    return request$;
  }

  private handleError<T>(): OperatorFunction<T, T> {
    return catchError((error: HttpErrorResponse) => {
      this.errorService.reportError(error);
      return throwError(() => error);
    });
  }

  private authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options: {
      data?: any;
      params?:
        | HttpParams
        | {
            [param: string]:
              | string
              | number
              | boolean
              | ReadonlyArray<string | number | boolean>;
          };
      additionalHeaders?: { [key: string]: string };
    } = {},
  ): Observable<T> {
    const { data, params, additionalHeaders } = options;

    return this.auth.accessToken$.pipe(
      filter((token: string | undefined): token is string => !!token),
      switchMap((token: string) => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
          ...additionalHeaders,
        });

        const url = `${this.serverUrl}/${path}`;

        switch (method) {
          case 'GET':
            return this.http.get<T>(url, { headers, params });
          case 'POST':
            return this.http.post<T>(url, data, { headers, params });
          case 'PATCH':
            return this.http.patch<T>(url, data, { headers });
          case 'DELETE':
            return this.http.delete<T>(url, { headers, params });
        }
      }),
    );
  }
}

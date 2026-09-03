import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  catchError,
  finalize,
  Observable,
  OperatorFunction,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { ErrorService } from '@pdz/layout/error/error.service';
import { environment } from '@pdz/environments/environment';

interface ErrorHandlingOptions {
  suppressErrorReporting?: boolean;
  suppressStatuses?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  private serverUrl = `${environment.tls ? 'https' : 'http'}://${
    environment.apiUrl
  }`;

  private pendingRequests = new Map<string, Observable<any>>();

  private invalidateCachePaths(paths: (string | string[])[]): void {
    for (const path of paths) {
      const keyPrefix = Array.isArray(path) ? path.join('/') : path;
      for (const key of this.pendingRequests.keys()) {
        if (key.startsWith(keyPrefix)) {
          this.pendingRequests.delete(key);
        }
      }
    }
  }

  get<T>(
    path: string | string[],
    options: {
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
      errorHandlingOptions?: ErrorHandlingOptions;
    } = {},
  ): Observable<T> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...options.additionalHeaders,
    });
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const key = apiUrl + JSON.stringify(options.params);
    if (this.pendingRequests.has(key)) return this.pendingRequests.get(key)!;
    const request$ = this.http
      .get<T>(`${this.serverUrl}/${apiUrl}`, {
        headers,
        params: options.params,
      })
      .pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
        this.handleError(options.errorHandlingOptions),
        finalize(() => {
          this.pendingRequests.delete(key);
        }),
      );
    this.pendingRequests.set(key, request$);
    return request$;
  }

  post<T>(
    path: string | string[],
    data: Object,
    options: {
      invalidateCache?: (string | string[])[];
    } = {},
  ): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const request$ = this.http
      .post<T>(`${this.serverUrl}/${apiUrl}`, data, { headers })
      .pipe(
        tap(() => {
          if (options?.invalidateCache)
            this.invalidateCachePaths(options.invalidateCache);
        }),
        this.handleError(),
      );
    return request$;
  }

  patch<T>(
    path: string | string[],
    data: Object,
    options?: { invalidateCache?: (string | string[])[] },
  ): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const request$ = this.http
      .patch<T>(`${this.serverUrl}/${apiUrl}`, data, { headers })
      .pipe(
        tap(() => {
          if (options?.invalidateCache)
            this.invalidateCachePaths(options.invalidateCache);
        }),
        this.handleError(),
      );
    return request$;
  }

  put<T>(
    path: string | string[],
    data: Object,
    options?: { invalidateCache?: (string | string[])[] },
  ): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const request$ = this.http
      .put<T>(`${this.serverUrl}/${apiUrl}`, data, { headers })
      .pipe(
        tap(() => {
          if (options?.invalidateCache)
            this.invalidateCachePaths(options.invalidateCache);
        }),
        this.handleError(),
      );
    return request$;
  }

  delete<T>(
    path: string | string[],
    options?: { invalidateCache?: (string | string[])[] },
  ): Observable<T> {
    const apiUrl = Array.isArray(path) ? path.join('/') : path;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const request$ = this.http
      .delete<T>(`${this.serverUrl}/${apiUrl}`, { headers })
      .pipe(
        tap(() => {
          if (options?.invalidateCache)
            this.invalidateCachePaths(options.invalidateCache);
        }),
        this.handleError(),
      );
    return request$;
  }

  private handleError<T>(
    options: ErrorHandlingOptions = {},
  ): OperatorFunction<T, T> {
    return catchError((error: HttpErrorResponse) => {
      const shouldSuppress =
        options.suppressErrorReporting ||
        options.suppressStatuses?.includes(error.status);

      if (!shouldSuppress) {
        this.errorService.reportError(error);
      }

      return throwError(() => error);
    });
  }
}

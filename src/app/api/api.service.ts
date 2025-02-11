import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
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

  get(
    path: string | string[],
    authenticated: boolean,
    params: { [key: string]: string } = {},
  ): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (Array.isArray(path)) path = path.join('/');
    if (authenticated) {
      return this.auth.getAccessToken().pipe(
        switchMap((token: string) => {
          headers = headers.set('authorization', `Bearer ${token}`);
          return this.http
            .get(`${this.serverUrl}/${path}`, {
              headers,
              params,
            })
            .pipe(
              catchError((error: HttpErrorResponse) => {
                this.errorService.reportError(error);
                return throwError(() => error);
              }),
            );
        }),
      );
    } else {
      return this.http
        .get(`${this.serverUrl}/${path}`, {
          headers,
          params,
        })
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.errorService.reportError(error);
            return throwError(() => error);
          }),
        );
    }
  }

  post(
    path: string | string[],
    authenticated: boolean,
    data: Object,
  ): Observable<any> {
    if (Array.isArray(path)) path = path.join('/');
    if (authenticated) {
      return this.auth.getAccessToken().pipe(
        switchMap((token: string) => {
          let httpOptions = {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
              authorization: `Bearer ${token}`,
            }),
          };
          return this.http
            .post(`${this.serverUrl}/${path}`, data, httpOptions)
            .pipe(
              catchError((error: HttpErrorResponse) => {
                this.errorService.reportError(error);
                return throwError(() => error);
              }),
            );
        }),
      );
    } else {
      let httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      };
      return this.http
        .post(`${this.serverUrl}/${path}`, data, httpOptions)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.errorService.reportError(error);
            return throwError(() => error);
          }),
        );
    }
  }

  patch(path: string | string[], data: any): Observable<any> {
    if (Array.isArray(path)) path = path.join('/');
    return this.auth.getAccessToken().pipe(
      switchMap((token: string) => {
        let httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        };
        return this.http
          .patch(`${this.serverUrl}/${path}`, data, httpOptions)
          .pipe(
            catchError((error: HttpErrorResponse) => {
              this.errorService.reportError(error);
              return throwError(() => error);
            }),
          );
      }),
    );
  }

  delete(path: string | string[]): Observable<any> {
    if (Array.isArray(path)) path = path.join('/');
    return this.auth.getAccessToken().pipe(
      switchMap((token: string) => {
        let httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        };
        return this.http.delete(`${this.serverUrl}/${path}`, httpOptions).pipe(
          catchError((error: HttpErrorResponse) => {
            this.errorService.reportError(error);
            return throwError(() => error);
          }),
        );
      }),
    );
  }
}

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
  private serverUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private errorService: ErrorService
  ) {}

  get(
    path: string,
    authenticated: boolean,
    params: { [key: string]: string } = {}
  ): Observable<any> {
    return this.auth.getAccessToken().pipe(
      switchMap((token: string) => {
        let headers;
        if (authenticated) {
          headers = new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          });
        } else {
          headers = new HttpHeaders({
            'Content-Type': 'application/json',
          });
        }
        return this.http
          .get(`${this.serverUrl}/${path}`, {
            headers,
            params,
          })
          .pipe(
            catchError((error: HttpErrorResponse) => {
              this.errorService.reportError(error);
              return throwError(() => error);
            })
          );
      })
    );
  }

  post(path: string, data: any): Observable<any> {
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
            })
          );
      })
    );
  }

  patch(path: string, data: any): Observable<any> {
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
            })
          );
      })
    );
  }

  delete(path: string): Observable<any> {
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
          })
        );
      })
    );
  }
}

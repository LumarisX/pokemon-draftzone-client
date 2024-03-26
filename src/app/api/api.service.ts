import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth0.service';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private serverUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  get(path: string): Observable<any> {
    return this.auth.getAccessToken().pipe(
      switchMap((token: string) => {
        let httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        };
        return this.http.get(`${this.serverUrl}/${path}`, httpOptions);
      })
    );
  }

  getDataWithParams(path: string, params: HttpParams): Observable<any> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      params: params,
    };
    return this.http.get(`${this.serverUrl}/${path}`, httpOptions);
  }

  getUnauth(path: string): Observable<any> {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    return this.http.get(`${this.serverUrl}/${path}`, httpOptions);
  }

  // Method to make a POST request with authorization header
  post(path: string, data: any): Observable<any> {
    return this.auth.getAccessToken().pipe(
      switchMap((token: string) => {
        let httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        };
        return this.http.post(`${this.serverUrl}/${path}`, data, httpOptions);
      })
    );
  }

  // Method to make a PATCH request with authorization header
  patch(path: string, data: any): Observable<any> {
    return this.auth.getAccessToken().pipe(
      switchMap((token: string) => {
        let httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        };
        return this.http.patch(`${this.serverUrl}/${path}`, data, httpOptions);
      })
    );
  }

  // Method to make a DELETE request
  delete(path: string): Observable<any> {
    return this.auth.getAccessToken().pipe(
      switchMap((token: string) => {
        let httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          }),
        };
        return this.http.delete(`${this.serverUrl}/${path}`, httpOptions);
      })
    );
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth0.service';
import { Observable, switchMap } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private serverUrl = 'https://api.pokemondraftzone.com';
  // private serverUrl = 'http://localhost:9960';

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

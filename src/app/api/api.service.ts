import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth0.service';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private serverUrl = 'https://api.pokemondraftzone.com:9960';

  constructor(private http: HttpClient, private auth: AuthService) {}

  get(path: string) {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        authorization: `Bearer ${this.auth.getAccessToken()}`,
      }),
    };
    return this.http.get(`${this.serverUrl}/${path}`, httpOptions);
  }

  post(path: string, data: any) {
    let httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        authorization: `Bearer ${this.auth.getAccessToken()}`,
      }),
    };
    console.log(data);
    return this.http.post(`${this.serverUrl}/${path}`, data, httpOptions);
  }

  delete(path: string) {
    console.log(`${this.serverUrl}/${path}`);
    return this.http.delete(`${this.serverUrl}/${path}`);
  }
}

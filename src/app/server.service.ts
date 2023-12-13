import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  private serverUrl = "http://localhost:9960";

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }

  constructor(private http:HttpClient) { }

  getUsers(){
    return (this.http.get(this.serverUrl + "/users"))
  }

  getLeagues(){
    return (this.http.get(this.serverUrl + "/users/hsoj/teams"))
  }
}

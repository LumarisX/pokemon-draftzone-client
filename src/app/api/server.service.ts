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

  constructor(private http: HttpClient) { }

  getUsers() {
    return (this.http.get(this.serverUrl + "/users"))
  }

  getDraftsList() {
    return (this.http.get(this.serverUrl + "/users/lumaris/teams"))
  }

  getDraft(teamName: string) {
    return this.http.get(`${this.serverUrl}/users/lumaris/${teamName}`);
  }

  getDraftById(teamId: string) {
    return this.http.get(`${this.serverUrl}/users/lumaris/${teamId}`);
  }

  // getMatchup(teamId: string, oppId: string) {
  //   return this.http.get(`${this.serverUrl}/matchup/${teamId}/${oppId}`);
  // }

  getSpeedchart(teamId: string, oppId: string){
    return this.http.get(`${this.serverUrl}/matchup/${teamId}/${oppId}/speedchart`)
  }

  getSummery(teamId: string, oppId: string){
    return this.http.get(`${this.serverUrl}/matchup/${teamId}/${oppId}/summery`)
  }

  getTypechart(teamId: string, oppId: string){
    return this.http.get(`${this.serverUrl}/matchup/${teamId}/${oppId}/typechart`)
  }

  getMovechart(teamId: string, oppId: string){
    return this.http.get(`${this.serverUrl}/matchup/${teamId}/${oppId}/movechart`)
  }
}

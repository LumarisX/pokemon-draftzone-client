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
    return (this.http.get(this.serverUrl + "/draft/lumaris/teams"))
  }

  getDraft(teamName: string) {
    return this.http.get(`${this.serverUrl}/draft/lumaris/${teamName}`);
  }

  getOpponents(teamName: string) {
    return this.http.get(`${this.serverUrl}/draft/lumaris/${teamName}/opponents`);
  }

  getDraftById(teamId: string) {
    return this.http.get(`${this.serverUrl}/users/lumaris/${teamId}`);
  }

  // getMatchup(teamId: string, oppId: string) {
  //   return this.http.get(`${this.serverUrl}/matchup/${teamId}/${oppId}`);
  // }

  getSpeedchart(matchupId: string) {
    return this.http.get(`${this.serverUrl}/matchup/${matchupId}/speedchart`)
  }

  getSummery(matchupId: string) {
    return this.http.get(`${this.serverUrl}/matchup/${matchupId}/summery`)
  }

  getTypechart(matchupId: string) {
    return this.http.get(`${this.serverUrl}/matchup/${matchupId}/typechart`)
  }

  getMovechart(matchupId: string) {
    return this.http.get(`${this.serverUrl}/matchup/${matchupId}/movechart`)
  }

  getCoveragechart(matchupId: string) {
    return this.http.get(`${this.serverUrl}/matchup/${matchupId}/coveragechart`)
  }
}

import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class DraftService {

    private serverUrl = "http://localhost:9960";

    httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    }

    constructor(private http: HttpClient) { }

    newDraft(draftData: any) {
        return this.http.post(`${this.serverUrl}/draft/lumaris/teams`, draftData)
    }

    newOpponent(teamID: string, opponentData: any) {
        return this.http.post(`${this.serverUrl}/draft/lumaris/${teamID}/`, opponentData)
    }
}
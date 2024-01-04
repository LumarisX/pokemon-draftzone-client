import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";

@Injectable({
    providedIn: 'root'
})

export class DraftService {

    constructor(private apiService: ApiService) { }

    newDraft(draftData: any) {
        return this.apiService.post(`/draft/lumaris/teams`, draftData)
    }

    newOpponent(teamID: string, opponentData: any) {
        return this.apiService.post(`/draft/lumaris/${teamID}/`, opponentData)
    }

    getDraftsList() {
        return (this.apiService.get("/draft/lumaris/teams"))
    }

    getDraft(teamName: string) {
        return this.apiService.get(`/draft/lumaris/${teamName}`);
    }

    getOpponents(teamName: string) {
        return this.apiService.get(`/draft/lumaris/${teamName}/opponents`);
    }
}
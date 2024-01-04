import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";

@Injectable({
    providedIn: 'root'
})

export class DraftService {

    constructor(private apiService: ApiService) { }

    getDraftsList() {
        return (this.apiService.get("draft/lumaris/teams"))
    }

    getDraft(teamName: string) {
        return this.apiService.get(`draft/lumaris/${teamName}`);
    }

    newDraft(draftData: any) {
        return this.apiService.post(`draft/lumaris/teams`, draftData)
    }

    getOpponents(teamName: string) {
        return this.apiService.get(`draft/lumaris/${teamName}/matchups`);
    }

    newOpponent(teamName: string, opponentData: any) {
        return this.apiService.post(`draft/lumaris/${teamName}/matchups`, opponentData)
    }
}
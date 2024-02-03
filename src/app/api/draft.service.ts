import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from '@auth0/auth0-angular';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  constructor(private apiService: ApiService, private auth: AuthService) {}

  getDraftsList() {
    return this.apiService.get('draft/lumaris/teams');
  }

  getDraft(teamName: string) {
    return this.apiService.get(`draft/lumaris/${teamName}`);
  }

  newDraft(draftData: any) {
    return this.apiService.post(`draft/lumaris/teams`, draftData);
  }

  getMatchups(teamName: string) {
    return this.apiService.get(`draft/lumaris/${teamName}/matchups`);
  }

  newMatchup(teamName: string, matchupData: any) {
    return this.apiService.post(
      `draft/lumaris/${teamName}/matchups`,
      matchupData
    );
  }

  deleteMatchup(matchupId: string) {
    return this.apiService.delete(`matchup/${matchupId}`);
  }
}

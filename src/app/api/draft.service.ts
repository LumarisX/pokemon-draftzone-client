import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from '../auth/auth0.service';
import { Matchup } from '../interfaces/matchup';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  constructor(private apiService: ApiService) {}

  getDraftsList() {
    return this.apiService.get('draft/teams');
  }

  getDraft(teamName: string) {
    return this.apiService.get(`draft/${teamName}`);
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get(`draft/${teamId}/${matchupId}`);
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`draft/teams`, draftData);
  }

  editDraft(draftId: string, draftData: Object) {
    return this.apiService.patch(`draft/${draftId}`, draftData);
  }

  getMatchupList(teamName: string) {
    return this.apiService.get(`draft/${teamName}/matchups`);
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(`draft/${teamName}/matchups`, matchupData);
  }

  editMatchup(matchupId: string, teamId: string, matchupData: Object) {
    return this.apiService.patch(`draft/${teamId}/${matchupId}`, matchupData);
  }

  deleteMatchup(matchupId: string) {
    return this.apiService.delete(`matchup/${matchupId}`);
  }

  scoreMatchup(matchupId: string, teamId: string, scoreData: Object) {
    return this.apiService.patch(
      `draft/${teamId}/${matchupId}/score`,
      scoreData
    );
  }
}

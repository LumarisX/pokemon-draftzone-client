import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  constructor(private apiService: ApiService) {}

  getDraftsList() {
    return this.apiService.get('draft/teams', true);
  }

  getDraft(teamName: string) {
    return this.apiService.get(`draft/${teamName}`, true);
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get(`draft/${teamId}/${matchupId}`, true);
  }

  getStats(teamName: string) {
    return this.apiService.get(`draft/${teamName}/stats`, true);
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`draft/teams`, true, draftData);
  }

  editDraft(draftId: string, draftData: Object) {
    return this.apiService.patch(`draft/${draftId}`, draftData);
  }

  getMatchupList(teamName: string) {
    return this.apiService.get(`draft/${teamName}/matchups`, true);
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(
      `draft/${teamName}/matchups`,
      true,
      matchupData
    );
  }

  editMatchup(matchupId: string, teamId: string, matchupData: Object) {
    return this.apiService.patch(`draft/${teamId}/${matchupId}`, matchupData);
  }

  deleteMatchup(matchupId: string) {
    return this.apiService.delete(`matchup/${matchupId}`);
  }

  archiveDraft(teamName: string) {
    return this.apiService.delete(`draft/${teamName}/archive`);
  }

  deleteDraft(teamName: string) {
    return this.apiService.delete(`draft/${teamName}`);
  }

  scoreMatchup(matchupId: string, teamId: string, scoreData: Object) {
    return this.apiService.patch(
      `draft/${teamId}/${matchupId}/score`,
      scoreData
    );
  }
  getGameTime(matchupId: string, teamId: string) {
    return this.apiService.get(`draft/${teamId}/${matchupId}/schedule`, true);
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `draft/${teamId}/${matchupId}/schedule`,
      timeData
    );
  }
}

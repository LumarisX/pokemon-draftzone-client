import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ArchiveService {
  constructor(private apiService: ApiService) {}

  getDraftsList() {
    return this.apiService.get('archive/teams');
  }

  getDraft(teamName: string) {
    return this.apiService.get(`archive/${teamName}`);
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get(`archive/${teamId}/${matchupId}`);
  }

  getStats(teamName: string) {
    return this.apiService.get(`archive/${teamName}/stats`);
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`archive/teams`, draftData);
  }

  editDraft(draftId: string, draftData: Object) {
    return this.apiService.patch(`archive/${draftId}`, draftData);
  }

  getMatchupList(teamName: string) {
    return this.apiService.get(`archive/${teamName}/matchups`);
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(`archive/${teamName}/matchups`, matchupData);
  }

  editMatchup(matchupId: string, teamId: string, matchupData: Object) {
    return this.apiService.patch(`archive/${teamId}/${matchupId}`, matchupData);
  }

  deleteMatchup(matchupId: string) {
    return this.apiService.delete(`matchup/${matchupId}`);
  }

  archiveDraft(teamName: string) {
    return this.apiService.delete(`archive/${teamName}/archive`);
  }

  deleteDraft(teamName: string) {
    return this.apiService.delete(`archive/${teamName}`);
  }

  scoreMatchup(matchupId: string, teamId: string, scoreData: Object) {
    return this.apiService.patch(
      `archive/${teamId}/${matchupId}/score`,
      scoreData
    );
  }
  getGameTime(matchupId: string, teamId: string) {
    return this.apiService.get(`archive/${teamId}/${matchupId}/schedule`);
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `archive/${teamId}/${matchupId}/schedule`,
      timeData
    );
  }
}

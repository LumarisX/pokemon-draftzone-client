import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ArchiveService {
  private apiService = inject(ApiService);


  getDraftsList() {
    return this.apiService.get('archive/teams', true);
  }

  getDraft(teamName: string) {
    return this.apiService.get(`archive/${teamName}`, true);
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get(`archive/${teamId}/${matchupId}`, true);
  }

  getStats(teamName: string) {
    return this.apiService.get(`archive/${teamName}/stats`, true);
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`archive/teams`, true, draftData);
  }

  editDraft(draftId: string, draftData: Object) {
    return this.apiService.patch(`archive/${draftId}`, draftData);
  }

  getMatchupList(teamName: string) {
    return this.apiService.get(`archive/${teamName}/matchups`, true);
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(
      `archive/${teamName}/matchups`,
      true,
      matchupData
    );
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
    return this.apiService.get(`archive/${teamId}/${matchupId}/schedule`, true);
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `archive/${teamId}/${matchupId}/schedule`,
      timeData
    );
  }
}

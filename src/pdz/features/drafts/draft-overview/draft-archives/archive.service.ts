import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { Archive } from '../archive-stats/archive.model';

@Injectable({
  providedIn: 'root',
})
export class ArchiveService {
  private apiService = inject(ApiService);

  getDraftsList() {
    return this.apiService.get<Archive[]>('archive/teams');
  }

  //Currently Unused
  getDraft(teamName: string) {
    return this.apiService.get(`archive/${teamName}`);
  }

  //Currently Unused
  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get(`archive/${teamId}/${matchupId}`);
  }

  //Currently Unused
  getStats(teamName: string) {
    return this.apiService.get(`archive/${teamName}/stats`);
  }

  //Currently Unused
  newDraft(draftData: Object) {
    return this.apiService.post(`archive/teams`, draftData);
  }

  //Currently Unused
  editDraft(draftId: string, draftData: Object) {
    return this.apiService.patch(`archive/${draftId}`, draftData);
  }

  //Currently Unused
  getMatchupList(teamName: string) {
    return this.apiService.get(`archive/${teamName}/matchups`);
  }

  //Currently Unused
  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(`archive/${teamName}/matchups`, matchupData);
  }

  //Currently Unused
  editMatchup(matchupId: string, teamId: string, matchupData: Object) {
    return this.apiService.patch(`archive/${teamId}/${matchupId}`, matchupData);
  }

  //Currently Unused
  deleteMatchup(matchupId: string) {
    return this.apiService.delete(`matchup/${matchupId}`);
  }

  //Currently Unused
  archiveDraft(teamName: string) {
    return this.apiService.delete(`archive/${teamName}/archive`);
  }

  deleteDraft(teamName: string) {
    return this.apiService.delete(`archive/${teamName}`);
  }

  //Currently Unused
  scoreMatchup(matchupId: string, teamId: string, scoreData: Object) {
    return this.apiService.patch(
      `archive/${teamId}/${matchupId}/score`,
      scoreData,
    );
  }

  //Currently Unused
  getGameTime(matchupId: string, teamId: string) {
    return this.apiService.get(`archive/${teamId}/${matchupId}/schedule`);
  }

  //Currently Unused
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `archive/${teamId}/${matchupId}/schedule`,
      timeData,
    );
  }
}

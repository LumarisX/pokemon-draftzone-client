import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Archive } from '../interfaces/archive';

@Injectable({
  providedIn: 'root',
})
export class ArchiveService {
  private apiService = inject(ApiService);

  getDraftsList() {
    return this.apiService.get<Archive[]>('archive/teams', {
      authenticated: true,
    });
  }

  getDraft(teamName: string) {
    return this.apiService.get(`archive/${teamName}`, { authenticated: true });
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get(`archive/${teamId}/${matchupId}`, {
      authenticated: true,
    });
  }

  getStats(teamName: string) {
    return this.apiService.get(`archive/${teamName}/stats`, {
      authenticated: true,
    });
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`archive/teams`, draftData, {
      authenticated: true,
    });
  }

  editDraft(draftId: string, draftData: Object) {
    return this.apiService.patch(`archive/${draftId}`, draftData);
  }

  getMatchupList(teamName: string) {
    return this.apiService.get(`archive/${teamName}/matchups`, {
      authenticated: true,
    });
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(
      `archive/${teamName}/matchups`,
      matchupData,
      { authenticated: true },
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
      scoreData,
    );
  }
  getGameTime(matchupId: string, teamId: string) {
    return this.apiService.get(`archive/${teamId}/${matchupId}/schedule`, {
      authenticated: true,
    });
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `archive/${teamId}/${matchupId}/schedule`,
      timeData,
    );
  }
}

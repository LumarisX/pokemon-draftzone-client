import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Stats } from '../drafts/draft-overview/draft-stats/draft-stats.component';
import { Observable } from 'rxjs';
import { Draft } from '../interfaces/draft';
import { DraftFormData } from '../drafts/draft-overview/draft-form/draft-form-core/draft-form-core.component';
import { Matchup } from '../interfaces/matchup';
import { Opponent } from '../interfaces/opponent';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  constructor(private apiService: ApiService) {}

  getDraftsList() {
    return this.apiService.get('draft/teams', true);
  }

  getDraft(teamName: string): Observable<Draft> {
    return this.apiService.get(`draft/${teamName}`, true);
  }

  getMatchup(matchupId: string, teamId: string): Observable<Matchup> {
    return this.apiService.get(`draft/${teamId}/${matchupId}`, true);
  }

  getOpponent(matchupId: string, teamId: string): Observable<Opponent> {
    return this.apiService.get(`draft/${teamId}/${matchupId}/opponent`, true);
  }

  getStats(teamName: string): Observable<Stats[]> {
    return this.apiService.get(`draft/${teamName}/stats`, true);
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`draft/teams`, true, draftData);
  }

  editDraft(draftId: string, draftData: DraftFormData) {
    return this.apiService.patch(`draft/${draftId}`, draftData);
  }

  getMatchupList(teamName: string): Observable<Opponent[]> {
    return this.apiService.get(`draft/${teamName}/matchups`, true);
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(
      `draft/${teamName}/matchups`,
      true,
      matchupData,
    );
  }

  editMatchup(matchupId: string, teamId: string, matchupData: Object) {
    return this.apiService.patch(
      `draft/${teamId}/${matchupId}/opponent`,
      matchupData,
    );
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
      scoreData,
    );
  }
  getGameTime(matchupId: string, teamId: string) {
    return this.apiService.get(`draft/${teamId}/${matchupId}/schedule`, true);
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `draft/${teamId}/${matchupId}/schedule`,
      timeData,
    );
  }
}

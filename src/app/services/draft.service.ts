import { Injectable, inject } from '@angular/core';
import { DraftFormData } from '../drafts/draft-overview/draft-form/draft-form-core/draft-form-core.component';
import { Draft, Pokemon } from '../interfaces/draft';
import { Matchup } from '../interfaces/matchup';
import { Opponent } from '../interfaces/opponent';
import { ApiService } from './api.service';

export type PokemonStat = {
  pokemon: Pokemon;
  kills: number;
  indirect: number;
  brought: number;
  deaths: number;
  kdr: number;
  kpg: number;
};

export type Stats = {
  pokemon: PokemonStat[];
};

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  private apiService = inject(ApiService);

  getDraftsList() {
    return this.apiService.get<Draft[]>('draft/teams', true);
  }

  getDraft(teamName: string) {
    return this.apiService.get<Draft>(`draft/${teamName}`, true);
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get<Matchup>(`draft/${teamId}/${matchupId}`, true);
  }

  getOpponent(matchupId: string, teamId: string) {
    return this.apiService.get<Opponent>(
      `draft/${teamId}/${matchupId}/opponent`,
      true,
    );
  }

  getStats(teamName: string) {
    return this.apiService.get<Stats>(`draft/${teamName}/stats`, true);
  }

  getArchiveStats(teamName: string) {
    return this.apiService.get<Stats>(`archive/${teamName}/stats`, true);
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`draft/teams`, true, draftData);
  }

  editDraft(draftId: string, draftData: DraftFormData) {
    return this.apiService.patch(`draft/${draftId}`, draftData);
  }

  getMatchupList(teamName: string) {
    return this.apiService.get<Opponent[]>(`draft/${teamName}/matchups`, true);
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
    //TODO: remove any
    return this.apiService.get<any>(
      `draft/${teamId}/${matchupId}/schedule`,
      true,
    );
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `draft/${teamId}/${matchupId}/schedule`,
      timeData,
    );
  }
}

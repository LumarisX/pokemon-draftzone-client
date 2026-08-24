import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { DraftFormData } from '@pdz/features/drafts/draft-overview/draft-form/draft-form-core/draft-form-core.component';
import { Draft, DraftPokemon } from '../draft.model';
import { Matchup } from '../matchup-overview/matchup.model';
import { Opponent } from '../opponent-overview/opponent.model';
import { Archive } from './archive.model';

export type PokemonStat = {
  pokemon: DraftPokemon;
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

const ROOTPATH = 'external/tournaments';

@Injectable({
  providedIn: 'root',
})
export class DraftService {
  private apiService = inject(ApiService);

  getDraftsList() {
    return this.apiService.get<{
      drafts: Draft[];
    }>(ROOTPATH);
  }

  getDraft(teamName: string) {
    return this.apiService.get<Draft>(`${ROOTPATH}/${teamName}`);
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get<Matchup>(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}`,
    );
  }

  getOpponent(matchupId: string, teamId: string) {
    return this.apiService.get<Opponent>(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/opponent`,
    );
  }

  getStats(teamName: string) {
    return this.apiService.get<Stats>(`${ROOTPATH}/${teamName}/stats`);
  }

  getArchiveStats(teamName: string) {
    return this.apiService.get<Stats>(`archive/${teamName}/stats`);
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`${ROOTPATH}`, draftData, {
      invalidateCache: [ROOTPATH],
    });
  }

  editDraft(draftId: string, draftData: DraftFormData) {
    return this.apiService.patch(`${ROOTPATH}/${draftId}`, draftData, {
      invalidateCache: [ROOTPATH, `${ROOTPATH}/${draftId}`],
    });
  }

  getMatchupList(teamName: string) {
    return this.apiService.get<Opponent[]>(`${ROOTPATH}/${teamName}/matchups`);
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(
      `${ROOTPATH}/${teamName}/matchups`,
      matchupData,
      {
        invalidateCache: [`${ROOTPATH}/${teamName}/matchups`],
      },
    );
  }

  editMatchup(matchupId: string, teamId: string, matchupData: Object) {
    return this.apiService.patch(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/opponent`,
      matchupData,
      {
        invalidateCache: [`${ROOTPATH}/${teamId}/matchups`],
      },
    );
  }

  deleteMatchup(matchupId: string, teamId: string) {
    return this.apiService.delete(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}`,
      {
        invalidateCache: [`${ROOTPATH}/${teamId}/matchups`],
      },
    );
  }

  archiveDraft(teamName: string) {
    return this.apiService.post(`${ROOTPATH}/${teamName}/archive`, {}, {
      invalidateCache: [ROOTPATH, `${ROOTPATH}/${teamName}`, 'archive/teams'],
    });
  }

  unarchiveDraft(teamName: string) {
    return this.apiService.delete(`${ROOTPATH}/${teamName}/archive`, {
      invalidateCache: [ROOTPATH, `${ROOTPATH}/${teamName}`, 'archive/teams'],
    });
  }

  deleteDraft(teamName: string) {
    return this.apiService.delete(`${ROOTPATH}/${teamName}`, {
      invalidateCache: ['tournaments/teams', `tournaments/${teamName}`],
    });
  }

  scoreMatchup(matchupId: string, teamId: string, scoreData: Object) {
    return this.apiService.patch(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/score`,
      scoreData,
    );
  }

  getArchiveList() {
    return this.apiService.get<Archive[]>('archive/teams');
  }

  deleteArchive(teamName: string) {
    return this.apiService.delete(`archive/${teamName}`);
  }
}

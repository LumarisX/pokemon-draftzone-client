import { Injectable, inject } from '@angular/core';
import { DraftFormData } from '@pdz/features/drafts/draft-overview/draft-form/draft-form-core/draft-form-core.component';
import { Draft, DraftPokemon } from '../draft.model';
import { Matchup } from '../matchup-overview/matchup.model';
import { Opponent } from '../opponent-overview/opponent.model';
import { ApiService } from '@pdz/core/services/api.service';
import { TournamentDetails } from '../../league-zone/league.model';

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
      tournaments: TournamentDetails[];
    }>(ROOTPATH, { authenticated: true });
  }

  getDraft(teamName: string) {
    return this.apiService.get<Draft>(`${ROOTPATH}/${teamName}`, {
      authenticated: true,
    });
  }

  getMatchup(matchupId: string, teamId: string) {
    return this.apiService.get<Matchup>(`${ROOTPATH}/${teamId}/${matchupId}`, {
      authenticated: true,
    });
  }

  getOpponent(matchupId: string, teamId: string) {
    return this.apiService.get<Opponent>(
      `${ROOTPATH}/${teamId}/${matchupId}/opponent`,
      { authenticated: true },
    );
  }

  getStats(teamName: string) {
    return this.apiService.get<Stats>(`${ROOTPATH}/${teamName}/stats`, {
      authenticated: true,
    });
  }

  getArchiveStats(teamName: string) {
    return this.apiService.get<Stats>(`archive/${teamName}/stats`, {
      authenticated: true,
    });
  }

  newDraft(draftData: Object) {
    return this.apiService.post(`${ROOTPATH}`, draftData, {
      authenticated: true,
      invalidateCache: [ROOTPATH],
    });
  }

  editDraft(draftId: string, draftData: DraftFormData) {
    return this.apiService.patch(`${ROOTPATH}/${draftId}`, draftData, {
      invalidateCache: [ROOTPATH, `${ROOTPATH}/${draftId}`],
    });
  }

  getMatchupList(teamName: string) {
    return this.apiService.get<Opponent[]>(`${ROOTPATH}/${teamName}/matchups`, {
      authenticated: true,
    });
  }

  newMatchup(teamName: string, matchupData: Object) {
    return this.apiService.post(
      `${ROOTPATH}/${teamName}/matchups`,
      matchupData,
      {
        authenticated: true,

        invalidateCache: [`${ROOTPATH}/${teamName}/matchups`],
      },
    );
  }

  editMatchup(matchupId: string, teamId: string, matchupData: Object) {
    return this.apiService.patch(
      `${ROOTPATH}/${teamId}/${matchupId}/opponent`,
      matchupData,
      {
        invalidateCache: [`${ROOTPATH}/${teamId}/matchups`],
      },
    );
  }

  deleteMatchup(matchupId: string) {
    return this.apiService.delete(`matchup/${matchupId}`, {
      invalidateCache: ['tournaments/${teamName}/matchups'],
    });
  }

  archiveDraft(teamName: string) {
    return this.apiService.delete(`${ROOTPATH}/${teamName}/archive`, {
      invalidateCache: ['tournaments/teams', `tournaments/${teamName}`],
    });
  }

  deleteDraft(teamName: string) {
    return this.apiService.delete(`${ROOTPATH}/${teamName}`, {
      invalidateCache: ['tournaments/teams', `tournaments/${teamName}`],
    });
  }

  scoreMatchup(matchupId: string, teamId: string, scoreData: Object) {
    return this.apiService.patch(
      `${ROOTPATH}/${teamId}/${matchupId}/score`,
      scoreData,
    );
  }
  getGameTime(matchupId: string, teamId: string) {
    //TODO: remove any
    return this.apiService.get<any>(
      `${ROOTPATH}/${teamId}/${matchupId}/schedule`,
      {
        authenticated: true,
      },
    );
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `${ROOTPATH}/${teamId}/${matchupId}/schedule`,
      timeData,
    );
  }
}

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
    return this.apiService.get<Matchup>(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}`,
      { authenticated: true },
    );
  }

  getOpponent(matchupId: string, teamId: string) {
    return this.apiService.get<Opponent>(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/opponent`,
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
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/opponent`,
      matchupData,
      {
        invalidateCache: [`${ROOTPATH}/${teamId}/matchups`],
      },
    );
  }

  // TODO: no server route exists for deleting a single external-tournament
  // matchup yet (ExternalMatchupController has no @Delete). This call 404s
  // until that endpoint is added.
  deleteMatchup(matchupId: string, teamId: string) {
    return this.apiService.delete(`matchup/${matchupId}`, {
      invalidateCache: [`${ROOTPATH}/${teamId}/matchups`],
    });
  }

  // TODO: no server route exists for archiving an external tournament yet
  // (ExternalTournamentController only has DELETE :tournamentKey, no
  // "/archive" sub-route). This call 404s until that endpoint is added.
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
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/score`,
      scoreData,
    );
  }
  getGameTime(matchupId: string, teamId: string) {
    //TODO: remove any
    return this.apiService.get<any>(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/schedule`,
      {
        authenticated: true,
      },
    );
  }
  scheduleMatchup(matchupId: string, teamId: string, timeData: Object) {
    return this.apiService.patch(
      `${ROOTPATH}/${teamId}/matchups/${matchupId}/schedule`,
      timeData,
    );
  }
}

import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { LeagueZoneService } from './league-zone.service';

@Injectable({
  providedIn: 'root',
})
export class LeagueManageService {
  private apiService = inject(ApiService);
  leagueZoneService = inject(LeagueZoneService);

  updateMatchupSchedule(
    matchupId: string,
    payload: {
      score?: { team1: number; team2: number };
      winner?: 'team1' | 'team2';
      matches: Array<{
        link?: string;
        winner: 'team1' | 'team2';
        team1: {
          score: number;
          pokemon: Record<
            string,
            {
              kills?: number;
              indirect?: number;
              deaths?: number;
              brought?: number;
            }
          >;
        };
        team2: {
          score: number;
          pokemon: Record<
            string,
            {
              kills?: number;
              indirect?: number;
              deaths?: number;
              brought?: number;
            }
          >;
        };
      }>;
    },
  ) {
    return this.apiService.post(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/schedule/${matchupId}`,
      true,
      payload,
    );
  }

  setPick(
    tournamentId: string,
    pick: {
      teamId: string;
      pokemonId: string;
      pickNumber: number;
      divisionId: string;
    },
  ) {
    return this.apiService.post(
      `leagues/tournaments/${tournamentId}/manage/divisions/${this.leagueZoneService.divisionKey()}/setdraft`,
      true,
      { pick: { pokemonId: pick.pokemonId }, teamId: pick.teamId },
    );
  }

  canManage(tournamentKey: string) {
    return this.apiService.get<string[]>(
      `leagues/tournaments/${tournamentKey}/roles`,
      true,
    );
  }

  setDivisionState(state: string) {
    return this.apiService.post(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/state`,
      true,
      { state },
    );
  }

  skipCurrentPick() {
    return this.apiService.post(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/skip`,
      true,
      '',
    );
  }
}

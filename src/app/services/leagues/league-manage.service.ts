import { Injectable, inject } from '@angular/core';
import { ApiService } from '../api.service';
import { LeagueZoneService } from './league-zone.service';
import { League } from '../../league-zone/league.interface';

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
          pokemon: Record<string, League.MatchPokemonStats | { status: null }>;
        };
        team2: {
          score: number;
          pokemon: Record<string, League.MatchPokemonStats | { status: null }>;
        };
      }>;
    },
  ) {
    return this.apiService.post(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/schedule/${matchupId}`,
      payload,
      { authenticated: true },
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
      { pick: { pokemonId: pick.pokemonId }, teamId: pick.teamId },
      { authenticated: true },
    );
  }

  canManage(tournamentKey: string) {
    return this.apiService.get<string[]>(
      `leagues/tournaments/${tournamentKey}/roles`,
      { authenticated: true },
    );
  }

  setDivisionState(state: string) {
    return this.apiService.post(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/state`,
      { state },
      { authenticated: true },
    );
  }

  skipCurrentPick() {
    return this.apiService.post(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/skip`,
      '',
      { authenticated: true },
    );
  }

  getSchedule() {
    return this.apiService.get<League.Stage[]>(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/schedule`,
      {
        authenticated: true,
      },
    );
  }
}

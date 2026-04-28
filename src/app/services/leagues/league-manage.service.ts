import { Injectable, inject } from '@angular/core';
import { TierPokemonAddon } from '../../interfaces/tier-pokemon.interface';
import { League, TradeLog } from '../../league-zone/league.interface';
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
      winner?:
        | 'side1'
        | 'side2'
        | 'draw'
        | 'side1ffw'
        | 'side2ffw'
        | 'dffl'
        | null;

      matches: Array<{
        link?: string;
        winner: 'side1' | 'side2' | 'draw';
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

  getTrades() {
    return this.apiService.get<{
      stages: {
        name: string;
        trades: TradeLog[];
      }[];
    }>(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/trades`,
      {
        authenticated: true,
      },
    );
  }

  getSchedule() {
    return this.apiService.get<{
      stages: League.Stage[];
      currentStage: number;
    }>(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/schedule`,
      {
        authenticated: true,
      },
    );
  }

  getPlayoffSchedule() {
    return this.apiService.get<{
      stages: League.Stage[];
      currentStage: number;
    }>(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/playoffs/schedule`,
      { authenticated: true },
    );
  }

  updatePlayoffMatchup(
    matchupId: string,
    payload: {
      score?: { team1: number; team2: number };
      winner?:
        | 'side1'
        | 'side2'
        | 'draw'
        | 'side1ffw'
        | 'side2ffw'
        | 'dffl'
        | null;
      matches: Array<{
        link?: string;
        winner: 'side1' | 'side2' | 'draw';
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
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/playoffs/schedule/${matchupId}`,
      payload,
      { authenticated: true },
    );
  }

  getPokemonList() {
    return this.apiService.get<{
      groups?: {
        roster: {
          id: string;
          name: string;
          cost: number;
          addons?: TierPokemonAddon[];
          setAddons?: string[];
        }[];
        team?: { id: string; name: string; coachName: string };
      }[];
      stages: string[];
      currentStage: number;
    }>(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/divisions/${this.leagueZoneService.divisionKey()}/pokemon-list`,
      { authenticated: true },
    );
  }
}

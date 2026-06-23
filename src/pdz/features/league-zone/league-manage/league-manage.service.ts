import { Injectable, inject } from '@angular/core';
import { TierPokemonAddon } from '../../tier-lists/tier-list.model';
import { League, TradeLog } from '@pdz/features/league-zone/league.interface';
import { ApiService } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '../league-zone.service';

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
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/stages/${this.leagueZoneService.stageId()}/matchups/${matchupId}`,
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
      draftId: string;
    },
  ) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${tournamentId}/drafts/${this.leagueZoneService.draftKey()}/teams/${pick.teamId}/draft`,
      { pokemonId: pick.pokemonId },
      { authenticated: true },
    );
  }

  canManage(leagueKey: string, tournamentKey: string) {
    return this.apiService.get<string[]>(
      `leagues/${leagueKey}/tournaments/${tournamentKey}/roles`,
      { authenticated: true },
    );
  }

  setDraftState(state: string) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/drafts/${this.leagueZoneService.draftKey()}/state`,
      { state },
      { authenticated: true },
    );
  }

  skipCurrentPick() {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/drafts/${this.leagueZoneService.draftKey()}/skip`,
      '',
      { authenticated: true },
    );
  }

  getTrades() {
    return this.apiService.get<{
      rounds: {
        name: string;
        trades: TradeLog[];
      }[];
    }>(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/stages/${this.leagueZoneService.stageId()}/trades`,
      {
        authenticated: true,
      },
    );
  }

  getSchedule() {
    return this.apiService.get<{
      rounds: League.Stage[];
      currentRoundIndex: number;
    }>(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/stages/${this.leagueZoneService.stageId()}/schedule`,
      {
        authenticated: true,
      },
    );
  }

  getTournamentSettings() {
    return this.apiService.get<{
      name: string;
      description?: string;
      format: string;
      ruleset: string;
      signUpDeadline: string;
      draftStart?: string;
      draftEnd?: string;
      seasonStart?: string;
      seasonEnd?: string;
      discord?: string;
      forfeit: { gameDiff: number; pokemonDiff: number };
      diffMode: 'pokemon' | 'game';
    }>(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/settings`,
      { authenticated: true },
    );
  }

  updateTournamentSettings(settings: {
    name: string;
    description?: string;
    format: string;
    ruleset: string;
    signUpDeadline: Date;
    draftStart?: Date;
    draftEnd?: Date;
    seasonStart?: Date;
    seasonEnd?: Date;
    discord?: string;
    forfeit?: { gameDiff: number; pokemonDiff: number };
    diffMode?: 'pokemon' | 'game';
  }) {
    return this.apiService.patch<{ message: string }>(
      `leagues/tournaments/${this.leagueZoneService.tournamentKey()}/manage/settings`,
      settings,
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
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/drafts/${this.leagueZoneService.draftKey()}/pokemon-list`,
      {
        authenticated: true,
        params: { stageId: this.leagueZoneService.stageId() ?? '' },
      },
    );
  }
}

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
      tierListId: string;
      draftCount: { min: number; max: number };
      pointTotal?: number;
      tierRequirements: { tierName: string; required: number }[];
    }>(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/settings`,
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
    return this.apiService.patch<{ success: boolean }>(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/settings`,
      settings,
    );
  }

  generateBracket(
    stageId: string,
    payload: {
      seedingMethod: 'certified-random' | 'manual';
      teamIds: string[];
      rounds: { name: string; bestOf?: number }[];
      matches: {
        key: string;
        roundIndex: number;
        section?: string;
        bracketRound?: number;
        position?: number;
        label?: string;
        a: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
        b: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
      }[];
    },
  ) {
    return this.apiService.post<{
      message: string;
      seeding: {
        method: 'certified-random' | 'manual';
        seededAt: string;
        inputTeamsHash: string | null;
        algorithmVersion: string | null;
        timesSeeded: number;
      };
      seedOrder: string[];
      matchIds: Record<string, string>;
    }>(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/stages/${stageId}/bracket`,
      payload,
      { authenticated: true },
    );
  }

  deleteBracket(stageId: string) {
    return this.apiService.delete<{ message: string }>(
      `leagues/${this.leagueZoneService.leagueKey()}/tournaments/${this.leagueZoneService.tournamentKey()}/stages/${stageId}/bracket`,
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

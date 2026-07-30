import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TierPokemonAddon } from '../../tier-lists/tier-list.model';
import { League, TradeLog } from '@pdz/features/league-zone/league.interface';
import { ApiService } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '../league-zone.service';

/** Payload every draft-mutating organizer endpoint echoes back. */
export type DraftDetails =
  ReturnType<LeagueZoneService['getDraftDetails']> extends Observable<infer T>
    ? T
    : never;

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
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${this.leagueZoneService.stageId()}/matchups/${matchupId}`,
      payload,
      { authenticated: true },
    );
  }

  setPick(
    tournamentSlug: string,
    pick: {
      teamId: string;
      pokemonId: string;
    },
  ) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${tournamentSlug}/drafts/${this.leagueZoneService.draftSlug()}/teams/${pick.teamId}/draft`,
      { add: [{ pokemonId: pick.pokemonId }] },
      { authenticated: true },
    );
  }

  /**
   * Organizer edit of a single draft turn: writes the pick into that team's
   * round slot rather than appending it, so correcting an earlier round doesn't
   * land the Pokemon at the end of their roster. Returns fresh draft details.
   */
  setRoundPick(
    teamId: string,
    round: number,
    pick: { pokemonId: string; addons?: string[] },
  ) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/teams/${teamId}/draft/rounds/${round}`,
      pick,
      { authenticated: true },
    );
  }

  /** Organizer removal of a drafted Pokemon. Returns fresh draft details. */
  clearPick(teamId: string, pokemonId: string) {
    return this.apiService.delete<DraftDetails>(
      `${this.draftPath()}/teams/${teamId}/draft/${pokemonId}`,
    );
  }

  /**
   * Points the draft back at a specific turn and hands that team a fresh clock.
   * Both indices are zero-based. Returns fresh draft details.
   */
  setCurrentPick(round: number, position: number) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/current-pick`,
      { round, position },
      { authenticated: true },
    );
  }

  /** Organizer-only, PRE_DRAFT-only: switch seeding mode and/or write a manual order. */
  setDraftOrder(payload: { useRandomSeeding: boolean; order?: string[] }) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/order`,
      payload,
      { authenticated: true },
    );
  }

  /**
   * Organizer-only. `channelId: null` clears it; omitted fields are left
   * untouched. `orderProgression`/`sequentialTurns` are PRE_DRAFT-only
   * server-side, same restriction as `setDraftOrder`.
   */
  updateDraftSettings(payload: {
    name?: string;
    channelId?: string | null;
    orderProgression?: 'snake' | 'linear';
    sequentialTurns?: boolean;
    visibility?: 'ALL' | 'SELF';
    allowRemovals?: boolean;
  }) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/settings`,
      payload,
      { authenticated: true },
    );
  }

  /** Organizer-only: sends a test message to the draft's saved channelId. */
  sendTestMessage() {
    return this.apiService.post<{ success: boolean }>(
      `${this.draftPath()}/settings/test-message`,
      '',
      { authenticated: true },
    );
  }

  private draftPath(): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}`;
  }

  canManage(leagueSlug: string, tournamentSlug: string) {
    return this.apiService.get<string[]>(
      `leagues/${leagueSlug}/tournaments/${tournamentSlug}/roles`,
      { authenticated: true },
    );
  }

  setDraftState(state: string) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}/state`,
      { state },
      { authenticated: true },
    );
  }

  setNoTimer(noTimer: boolean) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}/timer`,
      { noTimer },
      { authenticated: true },
    );
  }

  skipCurrentPick() {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}/skip`,
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
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${this.leagueZoneService.stageId()}/trades`,
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
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${this.leagueZoneService.stageId()}/schedule`,
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
      discordSettings?: {
        guildId?: string;
        coachRoleId?: string;
        signUpChannelId?: string;
      };
      forfeit: { gameDiff: number; pokemonDiff: number };
      diffMode: 'pokemon' | 'game';
      tierListId: string;
      draftCount: { min: number; max: number };
      pointTotal?: number;
      tierRequirements: { tierName: string; required: number }[];
      adSettings?: {
        advertise: boolean;
        skillLevelRange?: { from: string; to: string };
        prizeValue?: string;
        platforms?: string[];
      };
    }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/settings`,
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
    discordSettings?: {
      guildId?: string;
      coachRoleId?: string;
      signUpChannelId?: string;
    };
    forfeit?: { gameDiff: number; pokemonDiff: number };
    diffMode?: 'pokemon' | 'game';
    draftCount?: { min: number; max: number };
    /** `null` clears an existing point cap; `undefined` leaves it untouched. */
    pointTotal?: number | null;
    tierRequirements?: { tierName: string; required: number }[];
    adSettings?: {
      advertise: boolean;
      skillLevelRange?: { from: string; to: string };
      prizeValue?: string;
      platforms?: string[];
    };
  }) {
    return this.apiService.patch<{ success: boolean }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/settings`,
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
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${stageId}/bracket`,
      payload,
      { authenticated: true },
    );
  }

  deleteBracket(stageId: string) {
    return this.apiService.delete<{ message: string }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${stageId}/bracket`,
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
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}/pokemon-list`,
      {
        authenticated: true,
        params: { stageId: this.leagueZoneService.stageId() ?? '' },
      },
    );
  }
}

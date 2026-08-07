import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TierPokemonAddon } from '../../tier-lists/tier-list.model';
import { BracketSeedingInfo } from '@pdz/features/league-zone/league-bracket/bracket-mapping';
import { BracketRoundMeta } from '@pdz/features/league-zone/league-bracket/bracket.model';
import {
  TournamentBracket,
  UpdateTournamentBracketPayload,
  UpdateTournamentBracketResult,
} from '@pdz/features/league-zone/league-bracket/tournament-bracket.model';
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

  /**
   * `stageId` is passed in rather than read off {@link LeagueZoneService}: the
   * results editor is tournament-scoped, so no `:stageId` route param exists to
   * populate that signal, and a round can hold matchups from several stages.
   */
  updateMatchupSchedule(
    stageId: string,
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
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${stageId}/matchups/${matchupId}`,
      payload,
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
    );
  }

  /** Organizer-only, PRE_DRAFT-only: switch seeding mode and/or write a manual order. */
  setDraftOrder(payload: { useRandomSeeding: boolean; order?: string[] }) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/order`,
      payload,
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
    );
  }

  /** Organizer-only: sends a test message to the draft's saved channelId. */
  sendTestMessage() {
    return this.apiService.post<{ success: boolean }>(
      `${this.draftPath()}/settings/test-message`,
      '',
    );
  }

  private draftPath(): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}`;
  }

  canManage(leagueSlug: string, tournamentSlug: string) {
    return this.apiService.get<string[]>(
      `leagues/${leagueSlug}/tournaments/${tournamentSlug}/roles`,
    );
  }

  setDraftState(state: string) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}/state`,
      { state },
    );
  }

  setNoTimer(noTimer: boolean) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}/timer`,
      { noTimer },
    );
  }

  skipCurrentPick() {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${this.leagueZoneService.draftSlug()}/skip`,
      '',
    );
  }

  getTrades() {
    return this.apiService.get<{
      rounds: {
        name: string;
        trades: TradeLog[];
      }[];
    }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/trades`,
    );
  }

  getSchedule() {
    return this.apiService.get<{
      rounds: League.ScheduleRound[];
      currentRoundIndex: number;
    }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/schedule`,
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
      logo?: string;
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
      tradePointLimit?: number;
      tierRequirements: { tierName: string; required: number }[];
      adSettings?: {
        advertise: boolean;
        skillLevelRange?: { from: string; to: string };
        prizeValue?: string;
        platforms?: string[];
      };
      matchSettings?: { chat: boolean; coachReporting: boolean };
    }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/settings`,
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
    /** `null` clears the existing logo; `undefined` leaves it untouched. */
    logo?: string | null;
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
    tradePointLimit?: number | null;
    tierRequirements?: { tierName: string; required: number }[];
    adSettings?: {
      advertise: boolean;
      skillLevelRange?: { from: string; to: string };
      prizeValue?: string;
      platforms?: string[];
    };
    matchSettings?: { chat: boolean; coachReporting: boolean };
  }) {
    return this.apiService.patch<{ success: boolean }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/settings`,
      settings,
    );
  }

  generateBracket(
    stageId: string,
    payload: {
      /**
       * One entry per configured bracket section, in seed order: group i owns
       * the seeds immediately after group i-1. The server resolves each group
       * independently, so a "certified-random" group is shuffled only among
       * its own teams and never across section boundaries.
       */
      seedGroups: {
        teamIds: string[];
        method: 'certified-random' | 'manual';
        label?: string;
      }[];
      rounds: BracketRoundMeta[];
      sections?: {
        key: string;
        title?: string;
        kind?: string;
        label?: string;
        order?: number;
        teamCount?: number;
        roundTitles?: Record<number, string>;
      }[];
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
    );
  }

  /**
   * Applies an edited bracket to a stage that may already be under way.
   *
   * Rounds and matches carrying an `_id` are updated in place, so recorded
   * results survive the edit; anything the payload omits is removed. Send
   * `seedGroups` only to seed a stage for the first time or to append teams —
   * the server refuses a payload that would re-draw an existing seeding.
   */
  updateBracket(
    stageId: string,
    payload: {
      rounds: (BracketRoundMeta & { _id?: string })[];
      sections?: {
        key: string;
        title?: string;
        kind?: string;
        label?: string;
        order?: number;
        teamCount?: number;
        poolKey?: string;
        roundTitles?: Record<number, string>;
      }[];
      matches: {
        _id?: string;
        key: string;
        roundIndex: number;
        section?: string;
        bracketRound?: number;
        position?: number;
        label?: string;
        a: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
        b: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
      }[];
      seedGroups?: {
        teamIds: string[];
        method: 'certified-random' | 'manual';
        label?: string;
      }[];
    },
  ) {
    return this.apiService.patch<{
      message: string;
      seeding: BracketSeedingInfo;
      seedOrder: string[];
      matchIds: Record<string, string>;
    }>(
      // `patch` authenticates every request, so there is no flag to pass.
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${stageId}/bracket`,
      payload,
    );
  }

  deleteBracket(stageId: string) {
    return this.apiService.delete<{ message: string }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/stages/${stageId}/bracket`,
    );
  }

  // ─── Tournament-level bracket ──────────────────────────────────────────────
  //
  // Rounds belong to the tournament, so every stage shares them and the whole
  // bracket is edited as one unit. The per-stage endpoints above stay for
  // tournaments the sections-to-stages migration has not reached; they return
  // STG-007 once a tournament owns its rounds.

  private get tournamentBracketUrl(): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/bracket`;
  }

  getTournamentBracket() {
    return this.apiService.get<TournamentBracket>(this.tournamentBracketUrl);
  }

  /**
   * Applies an edited bracket to a tournament that may already be under way.
   *
   * Rounds, stages and matches carrying an `_id` are updated in place, so
   * recorded results survive the edit; anything the payload omits is removed.
   * Send a stage's `seedGroups` only to seed it for the first time or to append
   * teams — the server refuses a payload that would re-draw an existing draw.
   */
  updateTournamentBracket(payload: UpdateTournamentBracketPayload) {
    return this.apiService.patch<UpdateTournamentBracketResult>(
      this.tournamentBracketUrl,
      payload,
    );
  }

  setTournamentCurrentRound(currentRoundIndex: number) {
    return this.apiService.patch<{
      message: string;
      currentRoundIndex: number;
    }>(`${this.tournamentBracketUrl}/current-round`, { currentRoundIndex });
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
        params: { stageId: this.leagueZoneService.stageId() ?? '' },
      },
    );
  }
}

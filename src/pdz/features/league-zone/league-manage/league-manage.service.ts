import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TierPokemonAddon } from '../../tier-lists/tier-list.model';
import {
  TournamentBracket,
  UpdateTournamentBracketPayload,
  UpdateTournamentBracketResult,
} from '@pdz/features/league-zone/league-bracket/tournament-bracket.model';
import { League, TradeLog } from '@pdz/features/league-zone/league.interface';
import { ApiService } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '../league-zone.service';

export type DraftSettingsPayload = {
  name?: string;
  channelId?: string | null;
  orderProgression?: 'snake' | 'linear';
  sequentialTurns?: boolean;
  visibility?: 'ALL' | 'SELF';
  allowRemovals?: boolean;
  timerLength?: number;
  draftStart?: string | null;
  draftEnd?: string | null;
};

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
   * Names the side that leaves a match whose result cannot say so itself.
   *
   * The fix for a bracket stalled by a double forfeit: it decides nothing, so
   * the matches below it can never be filled until an organizer picks a side —
   * or `'none'` to rule that nobody advances. `null` withdraws the decision and
   * puts the bracket back on the recorded result.
   */
  setMatchupAdvancement(
    matchupSlug: string,
    advances: 'side1' | 'side2' | 'none' | null,
  ) {
    return this.apiService.post<{
      message: string;
      advances: 'side1' | 'side2' | 'none' | null;
    }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/matchups/${matchupSlug}/advancement`,
      { advances },
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

  setDraftOrderFor(
    draftSlug: string,
    payload: { useRandomSeeding: boolean; order?: string[] },
  ) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath(draftSlug)}/order`,
      payload,
    );
  }

  createDraftPool(payload: {
    name: string;
    draftStart?: string;
    draftEnd?: string;
  }) {
    return this.apiService.post<{ draftSlug: string; name: string }>(
      this.poolsPath(),
      payload,
    );
  }

  deleteDraftPool(draftSlug: string) {
    return this.apiService.delete<{ success: boolean; unassigned: number }>(
      `${this.poolsPath()}/${draftSlug}`,
    );
  }

  private poolsPath(): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts`;
  }

  updateCoachDetails(
    coachId: string,
    payload: {
      name?: string;
      gameName?: string;
      discordName?: string;
      timezone?: string;
      teamName?: string;
    },
  ) {
    return this.apiService.patch<{ message: string }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/coaches/${coachId}`,
      payload,
    );
  }

  updateDraftSettings(payload: DraftSettingsPayload) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/settings`,
      payload,
    );
  }

  updateDraftSettingsFor(draftSlug: string, payload: DraftSettingsPayload) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath(draftSlug)}/settings`,
      payload,
    );
  }

  setNoTimerFor(draftSlug: string, noTimer: boolean) {
    return this.apiService.post(`${this.draftPath(draftSlug)}/timer`, {
      noTimer,
    });
  }

  /** Organizer-only: sends a test message to the draft's saved channelId. */
  sendTestMessage() {
    return this.apiService.post<{ success: boolean }>(
      `${this.draftPath()}/settings/test-message`,
      '',
    );
  }

  private draftPath(draftSlug?: string): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/drafts/${draftSlug ?? this.leagueZoneService.draftSlug()}`;
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
      format: string | null;
      ruleset: string | null;
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
        autoGrantCoachRole?: boolean;
        signUpChannelId?: string;
      };
      forfeit: { gameDiff: number; pokemonDiff: number };
      diffMode: 'pokemon' | 'game';
      tierListId: string;
      draftCount: { min: number; max: number };
      pointTotal?: number;
      maxTeams?: number;
      signUpAccess?: 'open' | 'invite' | 'closed';
      signUpToken?: string;
      signUpQuestions?: {
        id: string;
        label: string;
        help?: string;
        type: 'short' | 'long' | 'choice' | 'multi' | 'boolean';
        options?: string[];
        required: boolean;
        maxLength?: number;
        dependsOn?: { questionId: string; equals: string };
        archived?: boolean;
      }[];
      tradePointLimit?: number;
      tierRequirements: { tierId: string; required: number; max?: number }[];
      prizeSplit?: { place: number; percent: number }[];
      adSettings?: {
        advertise: boolean;
        skillLevelRange?: { from: string; to: string };
        prizeValue?: string;
        platforms?: string[];
      };
      matchSettings?: { chat: boolean; coachReporting: boolean };
      archived?: boolean;
    }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/settings`,
    );
  }

  updateTournamentSettings(settings: {
    name?: string;
    description?: string;
    tierListId?: string;
    signUpDeadline?: Date;
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
      autoGrantCoachRole?: boolean;
      signUpChannelId?: string;
    };
    forfeit?: { gameDiff: number; pokemonDiff: number };
    diffMode?: 'pokemon' | 'game';
    draftCount?: { min: number; max: number };
    /** `null` clears an existing point cap; `undefined` leaves it untouched. */
    pointTotal?: number | null;
    /** `null` clears an existing team limit; `undefined` leaves it untouched. */
    maxTeams?: number | null;
    signUpAccess?: 'open' | 'invite' | 'closed';
    signUpQuestions?: {
      id: string;
      label: string;
      help?: string;
      type: 'short' | 'long' | 'choice' | 'multi' | 'boolean';
      options?: string[];
      required: boolean;
      maxLength?: number;
      dependsOn?: { questionId: string; equals: string };
      archived?: boolean;
    }[];
    tradePointLimit?: number | null;
    tierRequirements?: { tierId: string; required: number; max?: number }[];
    prizeSplit?: { place: number; percent: number }[];
    adSettings?: {
      advertise: boolean;
      skillLevelRange?: { from: string; to: string };
      prizeValue?: string;
      platforms?: string[];
    };
    matchSettings?: { chat: boolean; coachReporting: boolean };
    archived?: boolean;
  }) {
    return this.apiService.patch<{ success: boolean }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/settings`,
      settings,
    );
  }

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
        params: { stageSlug: this.leagueZoneService.stageSlug() ?? '' },
      },
    );
  }
}

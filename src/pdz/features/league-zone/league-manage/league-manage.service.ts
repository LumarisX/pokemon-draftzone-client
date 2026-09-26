import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  TournamentBracket,
  UpdateTournamentBracketPayload,
  UpdateTournamentBracketResult,
} from '@pdz/features/league-zone/league-bracket/tournament-bracket.model';
import { League, TradeLog } from '@pdz/features/league-zone/league.interface';
import { ApiService } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '../league-zone.service';

export type DiscordSettingsResponse = {
  guildId?: string;
  guildName?: string;
  linkedAt?: string;
  coachRoleId?: string;
  autoGrantCoachRole?: boolean;
  signUpChannelId?: string;
};

export type DiscordLinkCode = {
  code: string;
  expiresAt: string;
  command: string;
};

export type DraftSettingsPayload = {
  name?: string;
  channelId?: string | null;
  orderProgression?: 'snake' | 'linear';
  sequentialTurns?: boolean;
  picksVisibleTo?: League.PicksVisibleTo;
  allowDuplicates?: boolean;
  allowRemovals?: boolean;
  timerLength?: number;
  draftStart?: string | null;
  draftEnd?: string | null;
};

export type PoolDetails =
  ReturnType<LeagueZoneService['getPoolDetails']> extends Observable<infer T>
    ? T
    : never;

@Injectable({
  providedIn: 'root',
})
export class LeagueManageService {
  private apiService = inject(ApiService);
  leagueZoneService = inject(LeagueZoneService);

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

  setRoundPick(
    teamId: string,
    round: number,
    pick: { pokemonId: string; addons?: string[] },
  ) {
    return this.apiService.post<PoolDetails>(
      `${this.poolPath()}/teams/${teamId}/draft/rounds/${round}`,
      pick,
    );
  }

  clearPick(teamId: string, pokemonId: string) {
    return this.apiService.delete<PoolDetails>(
      `${this.poolPath()}/teams/${teamId}/draft/${pokemonId}`,
    );
  }

  setCurrentPick(round: number, position: number) {
    return this.apiService.post<PoolDetails>(
      `${this.poolPath()}/current-pick`,
      { round, position },
    );
  }

  setDraftOrder(payload: { useRandomSeeding: boolean; order?: string[] }) {
    return this.apiService.post<PoolDetails>(
      `${this.poolPath()}/order`,
      payload,
    );
  }

  setDraftOrderFor(
    poolSlug: string,
    payload: { useRandomSeeding: boolean; order?: string[] },
  ) {
    return this.apiService.post<PoolDetails>(
      `${this.poolPath(poolSlug)}/order`,
      payload,
    );
  }

  createPool(payload: {
    name: string;
    draftStart?: string;
    draftEnd?: string;
  }) {
    return this.apiService.post<{ poolSlug: string; name: string }>(
      this.poolsPath(),
      payload,
    );
  }

  deletePool(poolSlug: string) {
    return this.apiService.delete<{ message: string; unassigned: number }>(
      `${this.poolsPath()}/${poolSlug}`,
    );
  }

  private poolsPath(): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/pools`;
  }

  updateCoachDetails(
    coachId: string,
    payload: {
      name?: string;
      gameName?: string;
      discordName?: string;
      timezone?: string;
    },
  ) {
    return this.apiService.patch<{ message: string }>(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/coaches/${coachId}`,
      payload,
    );
  }

  updateDraftSettings(payload: DraftSettingsPayload) {
    return this.apiService.post<PoolDetails>(
      `${this.poolPath()}/settings`,
      payload,
    );
  }

  updateDraftSettingsFor(poolSlug: string, payload: DraftSettingsPayload) {
    return this.apiService.post<PoolDetails>(
      `${this.poolPath(poolSlug)}/settings`,
      payload,
    );
  }

  setNoTimerFor(poolSlug: string, noTimer: boolean) {
    return this.apiService.post(`${this.poolPath(poolSlug)}/timer`, {
      noTimer,
    });
  }

  sendTestMessage() {
    return this.apiService.post<{ delivered: boolean }>(
      `${this.poolPath()}/settings/test-message`,
      '',
    );
  }

  private poolPath(poolSlug?: string): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/pools/${poolSlug ?? this.leagueZoneService.poolSlug()}`;
  }

  canManage(leagueSlug: string, tournamentSlug: string) {
    return this.apiService.get<string[]>(
      `leagues/${leagueSlug}/tournaments/${tournamentSlug}/roles`,
    );
  }

  setDraftState(state: string) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/pools/${this.leagueZoneService.poolSlug()}/state`,
      { state },
    );
  }

  setNoTimer(noTimer: boolean) {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/pools/${this.leagueZoneService.poolSlug()}/timer`,
      { noTimer },
    );
  }

  skipCurrentPick() {
    return this.apiService.post(
      `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/pools/${this.leagueZoneService.poolSlug()}/skip`,
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

  createDiscordLinkCode(): Observable<DiscordLinkCode> {
    return this.apiService.post<DiscordLinkCode>(
      `${this.discordPath()}/link-code`,
      {},
    );
  }

  unlinkDiscord(): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(
      `${this.discordPath()}/link`,
    );
  }

  private discordPath(): string {
    return `leagues/${this.leagueZoneService.leagueSlug()}/tournaments/${this.leagueZoneService.tournamentSlug()}/discord`;
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
      discordSettings?: DiscordSettingsResponse;
      forfeit: { gameDiff: number; pokemonDiff: number };
      diffMode: 'pokemon' | 'game';
      standingsRules?: League.StandingsRules;
      standingsRulesCustomized?: boolean;
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
    logo?: string | null;
    discordSettings?: {
      coachRoleId?: string;
      autoGrantCoachRole?: boolean;
      signUpChannelId?: string;
    };
    forfeit?: { gameDiff: number; pokemonDiff: number };
    diffMode?: 'pokemon' | 'game';
    standingsRules?: Partial<League.StandingsRules>;
    draftCount?: { min: number; max: number };
    pointTotal?: number | null;
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
    return this.apiService.patch<{ message: string }>(
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
}

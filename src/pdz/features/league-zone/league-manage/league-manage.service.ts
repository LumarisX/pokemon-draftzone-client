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
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/teams/${teamId}/draft/rounds/${round}`,
      pick,
    );
  }

  clearPick(teamId: string, pokemonId: string) {
    return this.apiService.delete<DraftDetails>(
      `${this.draftPath()}/teams/${teamId}/draft/${pokemonId}`,
    );
  }

  setCurrentPick(round: number, position: number) {
    return this.apiService.post<DraftDetails>(
      `${this.draftPath()}/current-pick`,
      { round, position },
    );
  }

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

  createDiscordLinkCode(): Observable<DiscordLinkCode> {
    return this.apiService.post<DiscordLinkCode>(
      `${this.discordPath()}/link-code`,
      {},
    );
  }

  unlinkDiscord(): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(
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

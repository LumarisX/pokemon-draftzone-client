import { effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  BracketWithSeeding,
  mapRawBracket,
  RawBracketResponse,
} from '@pdz/features/league-zone/league-bracket/bracket-mapping';
import { defenseData } from '@pdz/features/league-zone/league-ghost';
import { TradeData } from '@pdz/features/league-zone/league-manage/league-manage-trades/league-manage-trades.component';
import {
  League,
  TradeLog,
  TradeStatus,
} from '@pdz/features/league-zone/league.interface';
import { TournamentBracket } from '@pdz/features/league-zone/league-bracket/tournament-bracket.model';
import {
  ChatChannel,
  ChatMessage,
  ChatRoom,
} from '@pdz/features/league-zone/league-chat/league-chat.model';
import {
  MatchupDetail,
  MatchupReportPayload,
} from '@pdz/features/league-zone/league-matchup/league-matchup.model';
import { TournamentDetails } from '@pdz/features/league-zone/league.model';
import { getRandomPokemon } from '@pdz/shared/data/namedex';
import { Observable, of, throwError } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ApiService } from '@pdz/core/services/api.service';
import { WebSocketService } from '@pdz/core/services/ws.service';
import { UploadService } from '@pdz/core/services/upload.service';

const ROOTPATH = 'leagues';

// The bracket wire format and its mapping live beside the bracket model;
// re-exported here because callers reach for them through this service.
export type {
  BracketSeedingGroup,
  BracketSeedingInfo,
  BracketWithSeeding,
} from '@pdz/features/league-zone/league-bracket/bracket-mapping';

@Injectable({
  providedIn: 'root',
})
export class LeagueZoneService {
  private apiService = inject(ApiService);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private webSocketService = inject(WebSocketService);

  leagueSlug = signal<string | null>(null);
  tournamentSlug = signal<string | null>(null);
  draftSlug = signal<string | null>(null);
  stageSlug = signal<string | null>(null);
  teamSlug = signal<string | null>(null);

  constructor() {
    this.webSocketService.connect();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.router.routerState.root;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.paramMap),
      )
      .subscribe((paramMap) => {
        const leagueSlug = paramMap.get('leagueSlug');
        this.leagueSlug.set(leagueSlug);
        const tournamentSlug = paramMap.get('tournamentSlug');
        this.tournamentSlug.set(tournamentSlug);
        const draftSlug = paramMap.get('draftSlug');
        this.draftSlug.set(draftSlug);
        const stageSlug = paramMap.get('stageSlug');
        this.stageSlug.set(stageSlug);
        const teamSlug = paramMap.get('teamSlug');
        this.teamSlug.set(teamSlug);
      });

    effect((onCleanup) => {
      const tournamentSlug = this.tournamentSlug();
      if (tournamentSlug) {
        this.webSocketService
          .sendMessage('league.subscribe', { tournamentSlug })
          .subscribe();
      }

      onCleanup(() => {
        if (tournamentSlug) {
          this.webSocketService
            .sendMessage('league.unsubscribe', { tournamentSlug })
            .subscribe();
        }
      });
    });
  }

  getTournamentsList() {
    return this.apiService.get<{ tournaments: TournamentDetails[] }>(ROOTPATH);
  }

  getRules(): Observable<League.RuleSection[]> {
    return this.apiService.get<League.RuleSection[]>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/rules`,
    );
  }

  saveRules(
    ruleSections: League.RuleSection[],
  ): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/rules`,
      { ruleSections },
    );
  }

  powerRankingDetails() {
    return this.apiService.get<League.PowerRankingTeam[]>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/power-rankings`,
    );
  }

  getDraftDetails(draftSlug?: string) {
    return this.apiService.get<{
      leagueName: string;
      draftName: string;
      teamOrder: string[];
      useRandomSeeding: boolean;
      channelId?: string;
      rounds: number;
      minDraftCount: number;
      tierRequirements: { tierName: string; required: number }[];
      points: number;
      teams: League.LeagueTeam[];
      orderProgression: 'snake' | 'linear';
      sequentialTurns: boolean;
      visibility: 'ALL' | 'SELF';
      allowRemovals: boolean;
      status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
      noTimer: boolean;
      skipTime: Date;
      currentPick: {
        round: number;
        position: number;
        skipTime?: Date;
      };
      canDraft: string[];
      canDraftCounts: Record<string, number>;
      logo: string;
    }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${draftSlug ?? this.draftSlug()}`,
    );
  }

  /**
   * Trades belong to the tournament: the round a trade takes effect in is
   * tournament-wide, so a roster change made during the group phase still
   * holds when the playoffs start.
   */
  getTrades() {
    const teamSlug = this.teamSlug();
    return this.apiService.get<{
      rounds: {
        name: string;
        trades: TradeLog[];
      }[];
      /** Rounds at or before this index have already been played. */
      currentRoundIndex: number;
      tradePoints: {
        limit: number | null;
        byTeam: { teamId: string; teamName: string; spent: number }[];
      };
    }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/trades`,
      {
        params: {
          ...(teamSlug ? { teamSlug } : undefined),
        },
      },
    );
  }

  sendTrade(tradeData: TradeData) {
    return this.apiService.post<{ message: string; status: TradeStatus }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/trades`,
      tradeData,
    );
  }

  /** Organizer resolution of a coach-submitted trade. */
  setTradeStatus(tradeId: string, status: 'APPROVED' | 'REJECTED') {
    return this.apiService.patch<{ message: string; status: TradeStatus }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/trades/${tradeId}`,
      { status },
    );
  }

  // getTierList() {
  //   const params: { [key: string]: string } = {};
  //   const divisionKey = this.divisionKey();
  //   if (divisionKey) params['division'] = divisionKey;
  //   return this.apiService.get<{
  //     tierList: LeagueTier[];
  //     divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
  //     ruleset?: string;
  //   }>(`${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/tier-list`, {
  //     params,
  //   });
  // }

  // getTierListEdit() {
  //   const params: { [key: string]: string } = {};
  //   const divisionKey = this.divisionKey();
  //   if (divisionKey) params['division'] = divisionKey;
  //   return this.apiService.get<{
  //     tierList: LeagueTier[];
  //     divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
  //   }>(
  //     `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/tier-list/edit`,

  //     { params },
  //   );
  // }

  // saveTierListEdit(
  //   tiers: Array<{
  //     name: string;
  //     cost: number;
  //     pokemon: Array<{ id: string; name: string; banned?: boolean }>;
  //   }>,
  // ) {
  //   return this.apiService.post<{ success: boolean; message: string }>(
  //     `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/tier-list/edit`,
  //     { tiers },
  //     { authenticated: true },
  //   );
  // }

  /**
   * The whole tournament's schedule, each round's matches grouped by stage.
   *
   * Tournament-scoped rather than per stage because rounds are: a coach's week
   * may contain matches from more than one stage at once.
   */
  getSchedule(params?: { round?: string }) {
    const teamSlug = this.teamSlug();
    return this.apiService.get<{
      rounds: League.ScheduleRound[];
      currentRoundIndex: number;
    }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/schedule`,
      {
        params: {
          ...(params?.round ? { round: params.round } : undefined),
          ...(teamSlug ? { teamSlug } : undefined),
        },
      },
    );
  }

  getPicks() {
    return this.apiService.get<League.DraftTeam[]>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/picks`,
    );
  }

  setPicks(
    teamId: string,
    picks: { pokemonId: string; addons?: string[] }[][],
  ) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/teams/${teamId}/picks`,
      { picks },
    );
  }

  draftPokemon(
    teamId: string,
    payload: {
      add?: { pokemonId: string; addons?: string[] }[];
      remove?: string[];
      picks?: { pokemonId: string; addons?: string[] }[][];
    },
  ) {
    return this.apiService.post<
      ReturnType<
        LeagueZoneService['getDraftDetails']
      > extends import('rxjs').Observable<infer T>
        ? T
        : never
    >(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/teams/${teamId}/draft`,
      payload,
    );
  }

  removeDraftPokemon(teamId: string, pokemonId: string) {
    return this.apiService.delete(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/teams/${teamId}/draft/${pokemonId}`,
    );
  }

  /**
   * Every team in the tournament, grouped by draft pool. Public — the teams
   * page is readable without a session or a sign-up.
   */
  getTeamsByDraft(): Observable<{
    drafts: {
      /** null for teams whose pool was removed or never assigned. */
      draftSlug: string | null;
      name: string;
      teams: League.LeagueTeam[];
    }[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/teams/by-draft`,
    );
  }

  getTeamDetail(teamIndex: number) {
    const team = defenseData[teamIndex];
    const roster: League.LeaguePokemon[] = [];
    const pokemonCount = Math.round(Math.random() * 2) + 10;
    for (let i = 0; i < pokemonCount; i++) {
      const brought = Math.round(Math.random() * 8);
      const kills = Math.round(Math.random() * 20);
      const deaths = Math.round(Math.random() * 20);
      const tera = Math.round(Math.random() * 6) ? undefined : [];
      const z = Math.round(Math.random() * 6) ? undefined : [];
      const dmax = Math.round(Math.random() * 6) === 0;

      roster.push({
        ...getRandomPokemon(),
        tier: Math.round(Math.random() * 20).toFixed(0),
        cost: Math.round(Math.random() * 10),
        record: {
          brought,
          kills,
          deaths,
        },
        capt: {
          tera,
          z,
          dmax,
        },
      });
    }

    const wins = Math.round(Math.random() * 8);
    const diff = Math.round(Math.random() * 20) - 10;

    return of({
      ...team,
      roster,
      timezone: 'EST/EDT',
      record: {
        wins,
        losses: 8 - wins,
        diff,
      },
    });
  }

  getDraftOrder(draftSlug: string) {
    return this.apiService.get<League.DraftRound[]>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${draftSlug}/order`,
    );
  }

  listStages(): Observable<League.StageSummary[]> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/stages`,
    );
  }

  signUp(signupData: object) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/signup`,
      signupData,
    );
  }

  getCoachData(options?: {
    suppressStatuses?: number[];
  }): Observable<League.CoachProfile> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/signup`,
      {
        errorHandlingOptions: { suppressStatuses: options?.suppressStatuses },
      },
    );
  }

  getDiscordJoinedStatus(discordId: string): Observable<{ joined: boolean }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/discord/joined/${discordId}`,
    );
  }

  getLeagueInfo(): Observable<League.LeagueInfo> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/info`,
    );
  }

  getLeague(): Observable<League.LeagueSummary> {
    return this.apiService.get(`${ROOTPATH}/${this.leagueSlug()}`);
  }

  getSignUps(): Observable<{
    signups: League.LeagueSignUp[];
    drafts: { name: string; draftSlug: string }[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/coaches`,
    );
  }

  updateSignUps(
    signups: { id: string; draft?: string; status?: League.SignUpStatus }[],
  ): Observable<{ message: string }> {
    return this.apiService.patch(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/coaches`,
      {
        assignments: signups.map((s) => ({
          coachId: s.id,
          divisionKey: s.draft || undefined,
          status: s.status,
        })),
      },
    );
  }

  /** Public read — the server allows this without a session, so anyone can view the schedule. */
  getTournamentBracket(): Observable<TournamentBracket> {
    return this.apiService.get<TournamentBracket>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/bracket`,
    );
  }

  getStageBracket(stageSlug: string): Observable<BracketWithSeeding> {
    return this.apiService
      .get<RawBracketResponse>(
        `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/stages/${stageSlug}/bracket`,
      )
      .pipe(map(mapRawBracket));
  }

  getTournamentTeams(): Observable<{
    teams: {
      id: string;
      teamName: string;
      coachName: string;
      logo?: string;
      pickCount: number;
      status: League.SignUpStatus;
      /** Draft pool the team drafted in; null if it was never assigned one. */
      draft: { draftSlug: string; name: string } | null;
      /**
       * What the team holds right now — the pick log with every approved trade
       * up to the current round applied. `cost`/`tier` are absent for a Pokémon
       * the tournament's tier list no longer carries.
       */
      roster: { id: string; name: string; cost?: number; tier?: string }[];
    }[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/teams`,
    );
  }

  getStandings(): Observable<{
    filters: League.StandingsFilter[];
    views: Record<string, League.StandingsView>;
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/standings`,
    );
  }

  /**
   * A team's page is tournament-scoped: its roster comes from the tournament's
   * trades and its record spans every stage it plays in, so there is no stage
   * to pass.
   */
  getTeam(teamSlug?: string): Observable<
    League.LeagueTeam & {
      pokemonStandings: League.PokemonStanding[];
      matchups: League.Matchup[];
    }
  > {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/teams/${teamSlug ?? this.teamSlug()}`,
    );
  }

  /**
   * Self-service team rename. The API authorises the team's own coach and
   * organizers.
   *
   * Takes both identifiers: the CRUD endpoint is keyed by ObjectId, while the
   * team page it invalidates is addressed by slug.
   */
  updateTeamInfo(
    teamId: string,
    teamSlug: string,
    changes: { teamName?: string; logo?: string },
  ) {
    return this.apiService.patch<{ _id: string; teamName: string }>(
      `teams/${teamId}`,
      changes,
      { invalidateCache: [this.teamPath(teamSlug)] },
    );
  }

  /** Self-service coach-profile edit. The API authorises the coach themself and organizers. */
  updateCoachProfile(
    coachId: string,
    changes: {
      name?: string;
      gameName?: string;
      discordName?: string;
      timezone?: string;
    },
  ) {
    return this.apiService.patch<{ _id: string }>(
      `coaches/${coachId}`,
      changes,
      {
        invalidateCache: [
          `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/signup`,
        ],
      },
    );
  }

  /**
   * A matchup is addressed at tournament level: its slug is unique, and the
   * stage it sits in is something the server reads off the matchup itself.
   */
  private matchupPath(matchupSlug: string): string {
    return `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/matchups/${matchupSlug}`;
  }

  getMatchupDetail(matchupSlug: string): Observable<MatchupDetail> {
    return this.apiService.get<MatchupDetail>(this.matchupPath(matchupSlug));
  }

  submitMatchupReport(
    matchupSlug: string,
    payload: MatchupReportPayload,
  ): Observable<{ message: string; status: 'pending' | 'approved' }> {
    return this.apiService.post(
      `${this.matchupPath(matchupSlug)}/report`,
      payload,
      { invalidateCache: [this.matchupPath(matchupSlug)] },
    );
  }

  setMatchupSchedule(
    matchupSlug: string,
    scheduledDate: string | null,
  ): Observable<{ message: string; scheduledDate: string | null }> {
    return this.apiService.post(
      `${this.matchupPath(matchupSlug)}/schedule`,
      { scheduledDate },
      { invalidateCache: [this.matchupPath(matchupSlug)] },
    );
  }

  reviewMatchupReport(
    matchupSlug: string,
    decision: 'approve' | 'reject',
  ): Observable<{ message: string; status: string }> {
    return this.apiService.post(
      `${this.matchupPath(matchupSlug)}/report/${decision}`,
      {},
      { invalidateCache: [this.matchupPath(matchupSlug)] },
    );
  }

  private chatPath(): string {
    return `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/chat`;
  }

  getChatMessages(channel: ChatChannel, target?: string): Observable<ChatRoom> {
    return this.apiService.get<ChatRoom>(`${this.chatPath()}/${channel}`, {
      params: target ? { target } : {},
    });
  }

  sendChatMessage(
    channel: ChatChannel,
    text: string,
    target?: string,
  ): Observable<{ message: ChatMessage }> {
    return this.apiService.post<{ message: ChatMessage }>(
      `${this.chatPath()}/${channel}`,
      { text, ...(target ? { target } : {}) },
      { invalidateCache: [`${this.chatPath()}/${channel}`] },
    );
  }

  deleteChatMessage(messageId: string): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(
      `${this.chatPath()}/messages/${messageId}`,
      { invalidateCache: [this.chatPath()] },
    );
  }

  private teamPath(teamSlug: string): string {
    return `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/teams/${teamSlug}`;
  }

  getLeagueUploadPresignedUrl(
    filename: string,
    contentType: string,
  ): Observable<{ url: string; key: string }> {
    return this.uploadService.getPresignedUploadUrl(
      filename,
      contentType,
      'team-logos',
    );
  }

  updateCoachLogo(coachId: string, fileKey: string) {
    const tournamentSlug = this.tournamentSlug();
    if (!tournamentSlug)
      return throwError(() => new Error('Tournament key not available'));

    return this.apiService.patch(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${tournamentSlug}/coaches/${coachId}/logo`,
      { fileKey },
      {
        invalidateCache: [
          `${ROOTPATH}/${this.leagueSlug()}/tournaments/${tournamentSlug}/signup`,
        ],
      },
    );
  }
}

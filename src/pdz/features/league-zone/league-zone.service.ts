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
  stageId = signal<string | null>(null);
  teamKey = signal<string | null>(null);

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
        const stageId = paramMap.get('stageId');
        this.stageId.set(stageId);
        const teamKey = paramMap.get('teamKey');
        this.teamKey.set(teamKey);
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
    return this.apiService.get<{ tournaments: TournamentDetails[] }>(ROOTPATH, {
      authenticated: true,
    });
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
      { authenticated: true },
    );
  }

  powerRankingDetails() {
    return this.apiService.get<League.PowerRankingTeam[]>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/power-rankings`,
      { authenticated: true },
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
      };
      canDraft: string[];
      canDraftCounts: Record<string, number>;
      logo: string;
    }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${draftSlug ?? this.draftSlug()}`,
      { authenticated: true },
    );
  }

  /**
   * Trades belong to the tournament: the round a trade takes effect in is
   * tournament-wide, so a roster change made during the group phase still
   * holds when the playoffs start.
   */
  getTrades() {
    const teamKey = this.teamKey();
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
        authenticated: true,
        params: {
          ...(teamKey ? { teamId: teamKey } : undefined),
        },
      },
    );
  }

  sendTrade(tradeData: TradeData) {
    return this.apiService.post<{ message: string; status: TradeStatus }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/trades`,
      tradeData,
      { authenticated: true },
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

  //     { authenticated: true, params },
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
    const teamKey = this.teamKey();
    return this.apiService.get<{
      rounds: League.ScheduleRound[];
      currentRoundIndex: number;
    }>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/schedule`,
      {
        authenticated: true,

        params: {
          ...(params?.round ? { round: params.round } : undefined),
          ...(teamKey ? { teamId: teamKey } : undefined),
        },
      },
    );
  }

  getPicks() {
    return this.apiService.get<League.DraftTeam[]>(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/picks`,
      { authenticated: true },
    );
  }

  setPicks(
    teamId: string,
    picks: { pokemonId: string; addons?: string[] }[][],
  ) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/teams/${teamId}/picks`,
      { picks },
      { authenticated: true },
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
      { authenticated: true },
    );
  }

  removeDraftPokemon(teamId: string, pokemonId: string) {
    return this.apiService.delete(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/teams/${teamId}/draft/${pokemonId}`,
    );
  }

  getTeams(stageId?: string): Observable<{ teams: League.LeagueTeam[] }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/drafts/${this.draftSlug()}/teams`,
      {
        authenticated: true,
        params: { stageId: stageId ?? this.stageId() ?? '' },
      },
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
      { authenticated: 'optional' },
    );
  }

  setStageVisibility(
    stageId: string,
    isPublic: boolean,
  ): Observable<{ message: string }> {
    return this.apiService.patch(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/stages/${stageId}`,
      { public: isPublic },
    );
  }

  /**
   * Rounds are deliberately absent: the bracket builder overwrites a stage's
   * rounds wholesale when it saves, so they are set there rather than here.
   */
  createStage(stage: {
    name: string;
    type: League.StageType;
    order: number;
    public: boolean;
  }): Observable<{ _id: string }> {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/stages`,
      stage,
      { authenticated: true },
    );
  }

  signUp(signupData: object) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/signup`,
      signupData,
      { authenticated: true },
    );
  }

  getCoachData(options?: {
    suppressStatuses?: number[];
  }): Observable<League.CoachProfile> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/signup`,
      {
        authenticated: true,
        errorHandlingOptions: { suppressStatuses: options?.suppressStatuses },
      },
    );
  }

  getDiscordJoinedStatus(discordId: string): Observable<{ joined: boolean }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/discord/joined/${discordId}`,
      { authenticated: true },
    );
  }

  getLeagueInfo(): Observable<League.LeagueInfo> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/info`,
      { authenticated: 'optional' },
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
      { authenticated: true },
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

  getBracket(): Observable<BracketWithSeeding> {
    return this.apiService
      .get<RawBracketResponse>(
        `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/bracket`,
        { authenticated: true },
      )
      .pipe(map(mapRawBracket));
  }

  getStageBracket(stageId: string): Observable<BracketWithSeeding> {
    return this.apiService
      .get<RawBracketResponse>(
        `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/stages/${stageId}/bracket`,
        { authenticated: true },
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
    }[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/teams`,
      { authenticated: true },
    );
  }

  getStandings(stageId?: string): Observable<{
    coachStandings: League.CoachStandingData;
    pokemonStandings: League.PokemonStanding[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/stages/${stageId ?? this.stageId()}/standings`,
      { authenticated: true },
    );
  }

  getTeam(
    stageId?: string,
    teamId?: string,
  ): Observable<
    League.LeagueTeam & {
      pokemonStandings: League.PokemonStanding[];
      matchups: League.Matchup[];
    }
  > {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/teams/${teamId ?? this.teamKey()}`,
      {
        authenticated: true,
        params: { stageId: stageId ?? this.stageId() ?? '' },
      },
    );
  }

  /** Self-service team rename. The API authorises the team's own coach and organizers. */
  updateTeamInfo(
    teamId: string,
    changes: { teamName?: string; logo?: string },
  ) {
    return this.apiService.patch<{ _id: string; teamName: string }>(
      `teams/${teamId}`,
      changes,
      { invalidateCache: [this.teamPath(teamId)] },
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

  private teamPath(teamId: string): string {
    return `${ROOTPATH}/${this.leagueSlug()}/tournaments/${this.tournamentSlug()}/teams/${teamId}`;
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

import { effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  BracketSlotFlex,
  BracketTeamFlex,
  FlexBracketData,
  FlexBracketMatch,
} from '@pdz/features/league-zone/league-bracket/bracket.model';
import { defenseData } from '@pdz/features/league-zone/league-ghost';
import { TradeData } from '@pdz/features/league-zone/league-manage/league-manage-trades/league-manage-trades.component';
import { League, TradeLog } from '@pdz/features/league-zone/league.interface';
import { TournamentDetails } from '@pdz/features/league-zone/league.model';
import { getRandomPokemon } from '@pdz/shared/data/namedex';
import { Observable, of, throwError } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ApiService } from '@pdz/core/services/api.service';
import { WebSocketService } from '@pdz/core/services/ws.service';
import { UploadService } from '@pdz/core/services/upload.service';

const ROOTPATH = 'leagues';

type RawBracketSlot =
  | { type: 'seed'; seed: number }
  | { type: 'winner'; from: string }
  | { type: 'loser'; from: string };

type RawBracketMatch = {
  _id: string;
  round: string;
  roundName: string;
  section?: string | null;
  bracketRound?: number | null;
  position?: number | null;
  label?: string | null;
  a: RawBracketSlot | null;
  b: RawBracketSlot | null;
  winner?: 0 | 1;
  replay?: string;
};

type RawBracketRound = {
  _id: string;
  name: string;
  matchDeadline: string | null;
};

export type BracketSeedingInfo = {
  method: 'certified-random' | 'manual';
  seededAt: string;
  inputTeamsHash: string | null;
  algorithmVersion: string | null;
  timesSeeded: number;
};

type RawBracketResponse = {
  format: string | null;
  seeding?: BracketSeedingInfo | null;
  teams: BracketTeamFlex[];
  rounds: RawBracketRound[];
  matches: RawBracketMatch[];
};

export type BracketWithSeeding = FlexBracketData & {
  seeding?: BracketSeedingInfo | null;
};

function mapBracketSlot(
  slot: RawBracketSlot | null | undefined,
): BracketSlotFlex | null {
  if (!slot) return null;
  return slot as BracketSlotFlex;
}

function mapRawBracket(raw: RawBracketResponse): BracketWithSeeding {
  const seeding = raw.seeding ?? null;
  if (!raw.format || !raw.matches?.length) {
    return { teams: raw.teams ?? [], matches: [], seeding };
  }

  const roundIndexMap = new Map<string, number>();
  (raw.rounds ?? []).forEach((r, i) => roundIndexMap.set(r._id, i));

  // Matches generated after the section/position fields existed carry their
  // own layout; older brackets fall back to flat-round + insertion order.
  const positionCounters = new Map<string, number>();

  const matches: FlexBracketMatch[] = raw.matches.map((m) => {
    const section = m.section ?? undefined;
    const roundIdx = m.bracketRound ?? roundIndexMap.get(m.round) ?? 0;
    const posKey = `${section ?? 'main'}:${roundIdx}`;
    const fallbackPosition = positionCounters.get(posKey) ?? 0;
    positionCounters.set(posKey, fallbackPosition + 1);

    return {
      id: m._id,
      round: roundIdx,
      position: m.position ?? fallbackPosition,
      ...(section ? { section } : {}),
      ...(m.label ? { label: m.label } : {}),
      a: mapBracketSlot(m.a) ?? { type: 'seed', seed: 0 },
      b: mapBracketSlot(m.b) ?? { type: 'seed', seed: 0 },
      ...(m.winner !== undefined ? { winner: m.winner } : {}),
      ...(m.replay ? { replay: m.replay } : {}),
    };
  });

  const hasSections = matches.some((m) => m.section);
  let sections: FlexBracketData['sections'];
  if (hasSections) {
    sections = [
      { key: 'winners', order: 0 },
      { key: 'losers', order: 1 },
      { key: 'finals', order: 2 },
      { key: 'main', order: 3 },
    ].filter((s) => matches.some((m) => (m.section ?? 'main') === s.key));
  } else {
    const roundTitles: Record<number, string> = {};
    (raw.rounds ?? []).forEach((r, i) => {
      roundTitles[i] = r.name;
    });
    sections = [{ key: 'main', roundTitles }];
  }

  const format =
    raw.format === 'single-elimination'
      ? 'single-elim'
      : raw.format === 'double-elimination'
        ? 'double-elim'
        : 'custom';

  return { format, teams: raw.teams ?? [], matches, sections, seeding };
}

@Injectable({
  providedIn: 'root',
})
export class LeagueZoneService {
  private apiService = inject(ApiService);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private webSocketService = inject(WebSocketService);

  leagueKey = signal<string | null>(null);
  tournamentKey = signal<string | null>(null);
  draftKey = signal<string | null>(null);
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
        const leagueKey = paramMap.get('leagueKey');
        this.leagueKey.set(leagueKey);
        const tournamentKey = paramMap.get('tournamentKey');
        this.tournamentKey.set(tournamentKey);
        const draftKey = paramMap.get('draftKey');
        this.draftKey.set(draftKey);
        const stageId = paramMap.get('stageId');
        this.stageId.set(stageId);
        const teamKey = paramMap.get('teamKey');
        this.teamKey.set(teamKey);
      });

    effect((onCleanup) => {
      const tournamentKey = this.tournamentKey();
      if (tournamentKey) {
        this.webSocketService
          .sendMessage('league.subscribe', { tournamentKey })
          .subscribe();
      }

      onCleanup(() => {
        if (tournamentKey) {
          this.webSocketService
            .sendMessage('league.unsubscribe', { tournamentKey })
            .subscribe();
        }
      });
    });
  }

  getTournamentsList() {
    return this.apiService.get<{ tournaments: TournamentDetails[] }>(
      ROOTPATH,
      { authenticated: true },
    );
  }

  getRules(): Observable<League.RuleSection[]> {
    return this.apiService.get<League.RuleSection[]>(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/rules`,
    );
  }

  saveRules(
    ruleSections: League.RuleSection[],
  ): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/rules`,
      { ruleSections },
      { authenticated: true },
    );
  }

  powerRankingDetails() {
    return this.apiService.get<League.PowerRankingTeam[]>(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${this.draftKey()}/power-rankings`,
      { authenticated: true },
    );
  }

  getDraftDetails(draftKey?: string) {
    return this.apiService.get<{
      leagueName: string;
      divisionName: string;
      teamOrder: string[];
      rounds: number;
      minDraftCount: number;
      points: number;
      teams: League.LeagueTeam[];
      orderProgression: 'snake' | 'linear';
      sequentialTurns: boolean;
      visibility: 'ALL' | 'SELF';
      allowRemovals: boolean;
      status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
      skipTime: Date;
      currentPick: {
        round: number;
        position: number;
      };
      canDraft: string[];
      canDraftCounts: Record<string, number>;
      logo: string;
    }>(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${draftKey ?? this.draftKey()}`,
      { authenticated: true },
    );
  }

  getTrades(params?: { stageId?: string }) {
    const teamKey = this.teamKey();
    const stageId = params?.stageId ?? this.stageId();
    return this.apiService.get<{
      rounds: {
        name: string;
        trades: TradeLog[];
      }[];
    }>(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/stages/${stageId}/trades`,
      {
        authenticated: true,
        params: {
          ...(teamKey ? { teamId: teamKey } : undefined),
        },
      },
    );
  }

  sendTrade(tradeData: TradeData, stageId?: string) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/stages/${stageId ?? this.stageId()}/trades`,
      tradeData,
      { authenticated: true },
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
  //   }>(`${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/tier-list`, {
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
  //     `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/tier-list/edit`,

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
  //     `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/tier-list/edit`,
  //     { tiers },
  //     { authenticated: true },
  //   );
  // }

  getSchedule(params?: { round?: string; stageId?: string }) {
    const teamKey = this.teamKey();
    const stageId = params?.stageId ?? this.stageId();
    return this.apiService.get<{
      rounds: League.Stage[];
      currentRoundIndex: number;
    }>(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/stages/${stageId}/schedule`,
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
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${this.draftKey()}/picks`,
      { authenticated: true },
    );
  }

  setPicks(
    teamId: string,
    picks: { pokemonId: string; addons?: string[] }[][],
  ) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${this.draftKey()}/teams/${teamId}/picks`,
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
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${this.draftKey()}/teams/${teamId}/draft`,
      payload,
      { authenticated: true },
    );
  }

  removeDraftPokemon(teamId: string, pokemonId: string) {
    return this.apiService.delete(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${this.draftKey()}/teams/${teamId}/draft/${pokemonId}`,
    );
  }

  getTeams(stageId?: string): Observable<{ teams: League.LeagueTeam[] }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${this.draftKey()}/teams`,
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

  getDraftOrder(draftKey: string) {
    return this.apiService.get<League.DraftRound[]>(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/drafts/${draftKey}/order`,
    );
  }

  listStages(): Observable<League.StageSummary[]> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/stages`,
    );
  }

  signUp(signupData: object) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/signup`,
      signupData,
      { authenticated: true },
    );
  }

  getCoachData(options?: {
    suppressStatuses?: number[];
  }): Observable<League.CoachProfile> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/signup`,
      {
        authenticated: true,
        errorHandlingOptions: { suppressStatuses: options?.suppressStatuses },
      },
    );
  }

  getDiscordJoinedStatus(discordId: string): Observable<{ joined: boolean }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/discord/joined/${discordId}`,
      { authenticated: true },
    );
  }

  getLeagueInfo(): Observable<League.LeagueInfo> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/info`,
      { authenticated: 'optional' },
    );
  }

  getLeague(): Observable<League.LeagueSummary> {
    return this.apiService.get(`${ROOTPATH}/${this.leagueKey()}`);
  }

  getSignUps(): Observable<{
    signups: League.LeagueSignUp[];
    drafts: { name: string; draftKey: string }[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/coaches`,
      { authenticated: true },
    );
  }

  updateSignUps(
    signups: { id: string; draft?: string; status?: League.SignUpStatus }[],
  ): Observable<{ message: string }> {
    return this.apiService.patch(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/coaches`,
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
        `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/bracket`,
        { authenticated: true },
      )
      .pipe(map(mapRawBracket));
  }

  getStageBracket(stageId: string): Observable<BracketWithSeeding> {
    return this.apiService
      .get<RawBracketResponse>(
        `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/stages/${stageId}/bracket`,
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
    }[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/teams`,
      { authenticated: true },
    );
  }

  getStandings(stageId?: string): Observable<{
    coachStandings: League.CoachStandingData;
    pokemonStandings: League.PokemonStanding[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/stages/${stageId ?? this.stageId()}/standings`,
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
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${this.tournamentKey()}/teams/${teamId ?? this.teamKey()}`,
      {
        authenticated: true,
        params: { stageId: stageId ?? this.stageId() ?? '' },
      },
    );
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
    const tournamentKey = this.tournamentKey();
    if (!tournamentKey)
      return throwError(() => new Error('Tournament key not available'));

    return this.apiService.patch(
      `${ROOTPATH}/${this.leagueKey()}/tournaments/${tournamentKey}/coaches/${coachId}/logo`,
      { fileKey },
      {
        invalidateCache: [
          `${ROOTPATH}/${this.leagueKey()}/tournaments/${tournamentKey}/signup`,
        ],
      },
    );
  }
}

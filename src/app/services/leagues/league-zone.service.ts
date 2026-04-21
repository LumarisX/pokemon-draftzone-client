import { effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { getRandomPokemon } from '../../data/namedex';
import { LeagueTier } from '../../interfaces/tier-pokemon.interface';
import { defenseData } from '../../league-zone/league-ghost';
import { TradeData } from '../../league-zone/league-manage/league-manage-trades/league-manage-trades.component';
import { League, TradeLog } from '../../league-zone/league.interface';
import { ApiService } from '../api.service';
import { UploadService } from '../upload.service';
import { WebSocketService } from '../ws.service';
import { BracketDataNormalized } from '../../league-zone/league-bracket/league-single-elim-bracket/league-bracket-graph.component';

const ROOTPATH = 'leagues';

@Injectable({
  providedIn: 'root',
})
export class LeagueZoneService {
  private apiService = inject(ApiService);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private webSocketService = inject(WebSocketService);

  tournamentKey = signal<string | null>(null);
  divisionKey = signal<string | null>(null);
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
        const tournamentKey = paramMap.get('tournamentKey');
        this.tournamentKey.set(tournamentKey);
        const divisionKey = paramMap.get('divisionKey');
        this.divisionKey.set(divisionKey);
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

  getRules(): Observable<League.RuleSection[]> {
    return this.apiService.get<League.RuleSection[]>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/rules`,
    );
  }

  saveRules(
    ruleSections: League.RuleSection[],
  ): Observable<{ success: boolean; message: string }> {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/rules`,
      { ruleSections },
      { authenticated: true },
    );
  }

  powerRankingDetails() {
    return this.apiService.get<League.PowerRankingTeam[]>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/power-rankings`,
      { authenticated: true },
    );
  }

  getDivisionDetails() {
    return this.apiService.get<{
      leagueName: string;
      divisionName: string;
      teamOrder: string[];
      rounds: number;
      points: number;
      teams: League.LeagueTeam[];
      draftStyle: 'snake' | 'linear';
      status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
      skipTime: Date;
      currentPick: {
        round: number;
        position: number;
      };
      canDraft: string[];
      logo: string;
    }>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}`,
      { authenticated: true },
    );
  }

  getTrades(params?: {}) {
    const teamKey = this.teamKey();
    return this.apiService.get<{
      stages: {
        name: string;
        trades: TradeLog[];
      }[];
    }>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/trades`,
      {
        authenticated: true,
        params: {
          ...params,
          ...(teamKey ? { teamId: teamKey } : undefined),
        },
      },
    );
  }

  sendTrade(tradeData: TradeData) {
    return this.apiService.post(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/manage/divisions/${this.divisionKey()}/trades`,
      tradeData,
      { authenticated: true },
    );
  }

  getTierList() {
    const params: { [key: string]: string } = {};
    const divisionKey = this.divisionKey();
    if (divisionKey) params['division'] = divisionKey;
    return this.apiService.get<{
      tierList: LeagueTier[];
      divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
    }>(`${ROOTPATH}/tournaments/${this.tournamentKey()}/tier-list`, {
      params,
    });
  }

  getTierListEdit() {
    const params: { [key: string]: string } = {};
    const divisionKey = this.divisionKey();
    if (divisionKey) params['division'] = divisionKey;
    return this.apiService.get<{
      tierList: LeagueTier[];
      divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
    }>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/tier-list/edit`,

      { authenticated: true, params },
    );
  }

  saveTierListEdit(
    tiers: Array<{
      name: string;
      pokemon: Array<{ id: string; name: string }>;
    }>,
  ) {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/tier-list/edit`,
      { tiers },
      { authenticated: true },
    );
  }

  getSchedule(
    params?: { stage?: string },
    divisionKeyOverride?: string | null,
  ) {
    const teamKey = this.teamKey();
    const divisionKey = divisionKeyOverride ?? this.divisionKey();
    return this.apiService.get<League.Stage[]>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${divisionKey}/schedule`,
      {
        authenticated: true,

        params: {
          ...params,
          ...(teamKey ? { teamId: teamKey } : undefined),
        },
      },
    );
  }

  getPicks() {
    return this.apiService.get<League.DraftTeam[]>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/picks`,
      { authenticated: true },
    );
  }

  setPicks(
    teamId: string,
    picks: { pokemonId: string; addons?: string[] }[][],
  ) {
    return this.apiService.post(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/teams/${teamId}/picks`,
      { picks },
      { authenticated: true },
    );
  }

  draftPokemon(teamId: string, pick: { pokemonId: string; addons?: string[] }) {
    return this.apiService.post(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/teams/${teamId}/draft`,
      { pick },
      { authenticated: true },
    );
  }

  getTeams(): Observable<{ teams: League.LeagueTeam[] }> {
    return this.apiService.get(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/teams`,
      { authenticated: true },
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

  getDraftOrder(divisionId: string) {
    return this.apiService.get<League.DraftRound[]>(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/division/${divisionId}/order`,
    );
  }

  signUp(signupData: object) {
    return this.apiService.post(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/signup`,
      signupData,
      { authenticated: true },
    );
  }

  getLeagueInfo(): Observable<League.LeagueInfo> {
    return this.apiService.get(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/info`,
    );
  }

  getSignUps(): Observable<{
    signups: League.LeagueSignUp[];
    divisions: { name: string; divisionKey: string }[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/signup/manage`,
      { authenticated: true },
    );
  }

  updateSignUps(
    signups: {}[],
  ): Observable<{ success: boolean; message: string }> {
    return this.apiService.post(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/signup/manage`,
      { signups },
      { authenticated: true },
    );
  }

  getBracket(): Observable<BracketDataNormalized> {
    return this.apiService.get(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/bracket`,
      { authenticated: true },
    );
  }

  getStandings(): Observable<{
    coachStandings: League.CoachStandingData;
    pokemonStandings: League.PokemonStanding[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/standings`,
      { authenticated: true },
    );
  }

  getTeam(): Observable<
    League.LeagueTeam & {
      pokemonStandings: League.PokemonStanding[];
      matchups: League.Matchup[];
    }
  > {
    return this.apiService.get(
      `${ROOTPATH}/tournaments/${this.tournamentKey()}/divisions/${this.divisionKey()}/teams/${this.teamKey()}`,
      { authenticated: true },
    );
  }

  getLeagueUploadPresignedUrl(
    filename: string,
    contentType: string,
  ): Observable<{ url: string; key: string }> {
    return this.uploadService.getUploadLink(filename, contentType);
  }

  confirmUpload(fileKey: string, fileSize: number, contentType: string) {
    return this.uploadService.confirmUploadWithBackend(
      fileKey,
      fileSize,
      contentType,
    );
  }

  confirmUploadWithRelatedEntity(
    fileKey: string,
    fileSize: number,
    contentType: string,
    relatedEntityId: string,
    tournamentId?: string,
  ) {
    return this.apiService.post(
      'file/confirm-upload',
      {
        fileKey,
        fileSize,
        contentType,
        relatedEntityId,
        tournamentId,
      },
      { authenticated: true },
    );
  }

  updateCoachLogo(coachId: string, fileKey: string) {
    const tournamentKey = this.tournamentKey();
    if (!tournamentKey)
      return throwError(() => new Error('Tournament key not available'));

    return this.apiService.patch(
      `${ROOTPATH}/tournaments/${tournamentKey}/coaches/${coachId}/logo`,
      { fileKey },
      {
        invalidateCache: [`${ROOTPATH}/tournaments/${tournamentKey}/signup`],
      },
    );
  }
}

import { effect, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { getRandomPokemon } from '../../data/namedex';
import { Pokemon } from '../../interfaces/pokemon';
import { LeagueTierGroup } from '../../interfaces/tier-pokemon.interface';
import { defenseData } from '../../league-zone/league-ghost';
import { League } from '../../league-zone/league.interface';
import { ApiService } from '../api.service';
import { UploadService } from '../upload.service';
import { WebSocketService } from '../ws.service';

const ROOTPATH = 'leagues';

@Injectable({
  providedIn: 'root',
})
export class LeagueZoneService {
  private apiService = inject(ApiService);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private webSocketService = inject(WebSocketService);

  leagueKey = signal<string | null>(null);
  divisionKey = signal<string | null>(null);
  teamKey = signal<string | null>(null);

  constructor() {
    this.webSocketService.connect('battlezone');

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
        const divisionKey = paramMap.get('divisionKey');
        this.divisionKey.set(divisionKey);
        const teamKey = paramMap.get('teamKey');
        this.teamKey.set(teamKey);
      });

    effect((onCleanup) => {
      const leagueKey = this.leagueKey();
      if (leagueKey) {
        this.webSocketService
          .sendMessage('league.subscribe', { leagueKey })
          .subscribe();
      }

      onCleanup(() => {
        if (leagueKey) {
          this.webSocketService
            .sendMessage('league.unsubscribe', { leagueKey })
            .subscribe();
        }
      });
    });
  }

  getRules(leagueKey: string): Observable<League.RuleSection[]> {
    return this.apiService.get<League.RuleSection[]>(
      `${ROOTPATH}/${this.leagueKey()}/rules`,
      false,
    );
  }

  powerRankingDetails() {
    return this.apiService.get<League.PowerRankingTeam[]>(
      `${ROOTPATH}/${this.leagueKey()}/divisions/${this.divisionKey()}/power-rankings`,
      true,
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
    }>(`${ROOTPATH}/${this.leagueKey()}/divisions/${this.divisionKey()}`, true);
  }

  getTierList() {
    const params: { [key: string]: string } = {};
    const divisionKey = this.divisionKey();
    if (divisionKey) params['division'] = divisionKey;
    return this.apiService.get<{
      tierList: LeagueTierGroup[];
      divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
    }>(`${ROOTPATH}/${this.leagueKey()}/tier-list`, false, params);
  }

  getPicks() {
    return this.apiService.get<League.DraftTeam[]>(
      `${ROOTPATH}/${this.leagueKey()}/divisions/${this.divisionKey()}/picks`,
      true,
    );
  }

  setPicks(teamId: string, picks: string[][]) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueKey()}/divisions/${this.divisionKey()}/teams/${teamId}/picks`,
      true,
      { picks },
    );
  }

  draftPokemon(teamId: string, pokemon: Pokemon) {
    return this.apiService.post(
      `${ROOTPATH}/${this.leagueKey()}/divisions/${this.divisionKey()}/teams/${teamId}/draft`,
      true,
      { pokemonId: pokemon.id },
    );
  }

  get getTeams() {
    return this.apiService.get(ROOTPATH, false);
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
      `${ROOTPATH}/${this.leagueKey()}/division/${divisionId}/order`,
      false,
    );
  }

  // getMatchups() {
  //   return of(this.matchups);
  // }

  // matchups: League.Matchup[] = [
  //   {
  //     team1: {
  //       teamName: 'Deimos Deoxys',
  //       coach: 'Lumaris',
  //       score: 1,
  //       logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
  //     },
  //     team2: {
  //       teamName: 'Mighty Murkrow',
  //       coach: 'hsoj',
  //       score: 2,
  //       logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
  //     },
  //     matches: [
  //       {
  //         link: 'test',
  //         team1: {
  //           score: 1,
  //           team: [
  //             {
  //               id: 'pelipper',
  //               name: 'Pelipper',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'archaludon',
  //               name: 'Archaludon',
  //               status: 'brought',
  //             },
  //             {
  //               id: 'swampertmega',
  //               name: 'Swampert-Mega',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'quaquaval',
  //               name: 'Quaquaval',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'claydol',
  //               name: 'Claydol',
  //             },
  //             {
  //               id: 'qwilfishhisui',
  //               name: 'Qwilfish-Hisui',
  //             },
  //           ],
  //         },
  //         team2: {
  //           score: 0,
  //           team: [
  //             {
  //               id: 'tapukoko',
  //               name: 'Tapu Koko',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'ironleaves',
  //               name: 'Iron Leaves',
  //             },
  //             {
  //               id: 'ironjugulis',
  //               name: 'Iron Jugulis',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'terapagosterastal',
  //               name: 'Terapagos-Terastal',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'clodsire',
  //               name: 'Clodsire',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'shedinja',
  //               name: 'Shedinja',
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         link: '',
  //         team1: {
  //           score: 0,
  //           team: [
  //             {
  //               id: 'pelipper',
  //               name: 'Pelipper',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'archaludon',
  //               name: 'Archaludon',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'swampertmega',
  //               name: 'Swampert-Mega',
  //             },
  //             {
  //               id: 'quaquaval',
  //               name: 'Quaquaval',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'claydol',
  //               name: 'Claydol',
  //             },
  //             {
  //               id: 'qwilfishhisui',
  //               name: 'Qwilfish-Hisui',
  //               status: 'fainted',
  //             },
  //           ],
  //         },
  //         team2: {
  //           score: 1,
  //           team: [
  //             {
  //               id: 'tapukoko',
  //               name: 'Tapu Koko',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'ironleaves',
  //               name: 'Iron Leaves',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'ironjugulis',
  //               name: 'Iron Jugulis',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'terapagosterastal',
  //               name: 'Terapagos-Terastal',
  //             },
  //             {
  //               id: 'clodsire',
  //               name: 'Clodsire',
  //               status: 'brought',
  //             },
  //             {
  //               id: 'shedinja',
  //               name: 'Shedinja',
  //             },
  //           ],
  //         },
  //       },
  //       {
  //         link: '',
  //         team1: {
  //           score: 0,
  //           team: [
  //             {
  //               id: 'pelipper',
  //               name: 'Pelipper',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'archaludon',
  //               name: 'Archaludon',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'swampertmega',
  //               name: 'Swampert-Mega',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'quaquaval',
  //               name: 'Quaquaval',
  //             },
  //             {
  //               id: 'claydol',
  //               name: 'Claydol',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'qwilfishhisui',
  //               name: 'Qwilfish-Hisui',
  //             },
  //           ],
  //         },
  //         team2: {
  //           score: 2,
  //           team: [
  //             {
  //               id: 'tapukoko',
  //               name: 'Tapu Koko',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'ironleaves',
  //               name: 'Iron Leaves',
  //             },
  //             {
  //               id: 'ironjugulis',
  //               name: 'Iron Jugulis',
  //             },
  //             {
  //               id: 'terapagosterastal',
  //               name: 'Terapagos-Terastal',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'clodsire',
  //               name: 'Clodsire',
  //               status: 'fainted',
  //             },
  //             {
  //               id: 'shedinja',
  //               name: 'Shedinja',
  //               status: 'brought',
  //             },
  //           ],
  //         },
  //       },
  //     ],
  //   },
  // ];

  signUp(signupData: object) {
    return this.apiService.post(
      `leagues/${this.leagueKey()}/signup`,
      true,
      signupData,
    );
  }

  getLeagueInfo(): Observable<League.LeagueInfo> {
    return this.apiService.get(`leagues/${this.leagueKey()}/info`, false);
  }

  getTiers(): Observable<LeagueTierGroup[]> {
    return this.apiService.get(`battlezone/pdbl/tiers`, false);
  }

  getDetails(): Observable<{
    format: string;
    ruleset: string;
    draft: [Date, Date];
    season: [Date, Date];
    prize: number;
  }> {
    return this.apiService.get(`battlezone/pdbl`, false);
  }

  getSignUps(leagueKey: string): Observable<League.LeagueSignUp[]> {
    return this.apiService.get(`leagues/${leagueKey}/signup`, true);
  }

  getBracket(leagueKey: string): Observable<{}> {
    return this.apiService.get(`leagues/bracket`, true);
  }

  getStandings(): Observable<{
    coachStandings: League.CoachStandingData;
    pokemonStandings: League.PokemonStanding[];
  }> {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/divisions/${this.divisionKey()}/standings`,
      true,
    );
  }

  getTeam(teamId: string) {
    return this.apiService.get(
      `${ROOTPATH}/${this.leagueKey()}/teams/${teamId}`,
      true,
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
    relatedEntityId?: string,
  ) {
    return this.apiService.post('file/confirm-upload', true, {
      fileKey,
      fileSize,
      contentType,
      relatedEntityId,
    });
  }
}

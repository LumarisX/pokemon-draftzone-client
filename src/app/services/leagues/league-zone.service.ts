import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { getRandomPokemon } from '../../data/namedex';
import { defenseData } from '../../league-zone/league-ghost';
import { TeamPokemon } from '../../league-zone/league-teams/league-team-card/league-team-card.component';
import { League } from '../../league-zone/league.interface';
import { ApiService } from '../api.service';
import { RuleCategory } from '../league-drafting.service';
import { LeagueTierGroup } from '../../interfaces/tier-pokemon.interface';

const ROOTPATH = 'leagues';

export type LeagueSignUp = {
  name: string;
  timezone: string;
  experience: string;
  dropped?: string;
  confirm: boolean;
  sub: string;
};

export type DraftPick = {
  pokemonId: string;
  tier: string;
  timestamp: Date;
  picker: string;
};

export type DraftTeam = {
  id: string;
  name: string;
  picks: DraftPick[];
};

@Injectable({
  providedIn: 'root',
})
export class LeagueZoneService {
  private apiService = inject(ApiService);

  getRules(leagueId: string): Observable<RuleCategory[]> {
    return this.apiService.get<RuleCategory[]>(
      `${ROOTPATH}/${leagueId}/rules`,
      false,
    );
  }

  getTierList(leagueId: string) {
    return this.apiService.get<{
      tierList: LeagueTierGroup[];
      divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
    }>(`${ROOTPATH}/${leagueId}/tier-list`, false);
  }

  getPicks(leagueId: string, divisionId: string) {
    return this.apiService.get<DraftTeam[]>(
      `${ROOTPATH}/${leagueId}/${divisionId}/picks`,
      false,
    );
  }

  get getTeams() {
    return this.apiService.get(ROOTPATH, false);
  }

  getTeamDetail(teamIndex: number) {
    const team = defenseData[teamIndex];
    const roster: TeamPokemon[] = [];
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
        tier: Math.round(Math.random() * 20),
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

  getMatchups() {
    return of(this.matchups);
  }

  matchups: League.Matchup[] = [
    {
      team1: {
        teamName: 'Deimos Deoxys',
        coach: 'Lumaris',
        score: 1,
        logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
      },
      team2: {
        teamName: 'Mighty Murkrow',
        coach: 'hsoj',
        score: 2,
        logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
      },
      matches: [
        {
          link: 'test',
          team1: {
            score: 1,
            team: [
              {
                id: 'pelipper',
                name: 'Pelipper',
                status: 'fainted',
              },
              {
                id: 'archaludon',
                name: 'Archaludon',
                status: 'brought',
              },
              {
                id: 'swampertmega',
                name: 'Swampert-Mega',
                status: 'fainted',
              },
              {
                id: 'quaquaval',
                name: 'Quaquaval',
                status: 'fainted',
              },
              {
                id: 'claydol',
                name: 'Claydol',
              },
              {
                id: 'qwilfishhisui',
                name: 'Qwilfish-Hisui',
              },
            ],
          },
          team2: {
            score: 0,
            team: [
              {
                id: 'tapukoko',
                name: 'Tapu Koko',
                status: 'fainted',
              },
              {
                id: 'ironleaves',
                name: 'Iron Leaves',
              },
              {
                id: 'ironjugulis',
                name: 'Iron Jugulis',
                status: 'fainted',
              },
              {
                id: 'terapagosterastal',
                name: 'Terapagos-Terastal',
                status: 'fainted',
              },
              {
                id: 'clodsire',
                name: 'Clodsire',
                status: 'fainted',
              },
              {
                id: 'shedinja',
                name: 'Shedinja',
              },
            ],
          },
        },
        {
          link: '',
          team1: {
            score: 0,
            team: [
              {
                id: 'pelipper',
                name: 'Pelipper',
                status: 'fainted',
              },
              {
                id: 'archaludon',
                name: 'Archaludon',
                status: 'fainted',
              },
              {
                id: 'swampertmega',
                name: 'Swampert-Mega',
              },
              {
                id: 'quaquaval',
                name: 'Quaquaval',
                status: 'fainted',
              },
              {
                id: 'claydol',
                name: 'Claydol',
              },
              {
                id: 'qwilfishhisui',
                name: 'Qwilfish-Hisui',
                status: 'fainted',
              },
            ],
          },
          team2: {
            score: 1,
            team: [
              {
                id: 'tapukoko',
                name: 'Tapu Koko',
                status: 'fainted',
              },
              {
                id: 'ironleaves',
                name: 'Iron Leaves',
                status: 'fainted',
              },
              {
                id: 'ironjugulis',
                name: 'Iron Jugulis',
                status: 'fainted',
              },
              {
                id: 'terapagosterastal',
                name: 'Terapagos-Terastal',
              },
              {
                id: 'clodsire',
                name: 'Clodsire',
                status: 'brought',
              },
              {
                id: 'shedinja',
                name: 'Shedinja',
              },
            ],
          },
        },
        {
          link: '',
          team1: {
            score: 0,
            team: [
              {
                id: 'pelipper',
                name: 'Pelipper',
                status: 'fainted',
              },
              {
                id: 'archaludon',
                name: 'Archaludon',
                status: 'fainted',
              },
              {
                id: 'swampertmega',
                name: 'Swampert-Mega',
                status: 'fainted',
              },
              {
                id: 'quaquaval',
                name: 'Quaquaval',
              },
              {
                id: 'claydol',
                name: 'Claydol',
                status: 'fainted',
              },
              {
                id: 'qwilfishhisui',
                name: 'Qwilfish-Hisui',
              },
            ],
          },
          team2: {
            score: 2,
            team: [
              {
                id: 'tapukoko',
                name: 'Tapu Koko',
                status: 'fainted',
              },
              {
                id: 'ironleaves',
                name: 'Iron Leaves',
              },
              {
                id: 'ironjugulis',
                name: 'Iron Jugulis',
              },
              {
                id: 'terapagosterastal',
                name: 'Terapagos-Terastal',
                status: 'fainted',
              },
              {
                id: 'clodsire',
                name: 'Clodsire',
                status: 'fainted',
              },
              {
                id: 'shedinja',
                name: 'Shedinja',
                status: 'brought',
              },
            ],
          },
        },
      ],
    },
  ];

  signUp(signupData: object) {
    return this.apiService.post(`leagues/pdbls2/signup`, true, signupData);
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

  getSignUps(leagueId: string): Observable<LeagueSignUp[]> {
    return this.apiService.get(`leagues/${leagueId}/signup`, true);
  }
}

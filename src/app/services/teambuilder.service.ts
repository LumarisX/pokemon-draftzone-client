import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StatsTable } from '../data';
import { Pokemon } from '../interfaces/draft';
import { TeambuilderPokemon } from '../tools/teambuilder/pokemon-builder.model';
import { ApiService } from './api.service';

export type setCalcs = {
  attacker: string;
  defender: string;
  calcs: {
    move: {
      name: string;
      type: string;
    };
    chance: string;
    n: number;
    min:
      | {
          chance: string;
          n: number;
          set: {
            ivs: StatsTable;
            evs: StatsTable;
            nature: string;
            ability?: string;
            item?: string;
          };
        }
      | undefined;
    max:
      | {
          chance: string;
          n: number;
          set: {
            ivs: StatsTable;
            evs: StatsTable;
            nature: string;
            ability?: string;
            item?: string;
          };
        }
      | undefined;
  }[];
};

@Injectable({
  providedIn: 'root',
})
export class TeambuilderService {
  private apiService = inject(ApiService);


  getPokemonData(id: string, ruleset: string): Observable<TeambuilderPokemon> {
    return this.apiService.get('teambuilder/pokemonData', false, {
      id,
      ruleset,
    });
  }

  getPatsList(): Observable<(Pokemon & { percent: number })[]> {
    return this.apiService.get('teambuilder/pats-list', false);
  }

  getPatsMatchup(data: {
    set: string;
    opp: string;
  }): Observable<{ link: string; results: [setCalcs, setCalcs] } | undefined> {
    return this.apiService.get('teambuilder/pats-matchup', false, data);
  }
}

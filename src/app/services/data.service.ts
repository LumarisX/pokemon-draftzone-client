import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pokemon as OldPokemon } from '../interfaces/draft';
import { Pokemon } from '../interfaces/pokemon';

import { ApiService } from './api.service';
import { Stat } from '../data';

type Format = string;
type Ruleset = string;

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiService = inject(ApiService);


  cache: {
    formats?: string[];
    rulesets?: string[];
    pokemonList: { [key: string]: OldPokemon[] };
    formes: { [key: string]: OldPokemon[] };
  } = {
    pokemonList: {},
    formes: {},
  };

  //replace with fromat grouped eventually
  getFormats(): Observable<Format[]> {
    if (this.cache.formats) {
      return of(this.cache.formats);
    } else {
      return this.apiService.get('data/formats', false).pipe(
        tap((formats: string[]) => {
          this.cache.formats = formats;
        }),
      );
    }
  }

  getFormatsGrouped(): Observable<
    [string, { name: string; id: string; desc?: string }[]][]
  > {
    return this.apiService.get('data/formatsgrouped', false);
  }

  //replace with ruleset grouped eventually
  getRulesets(): Observable<Ruleset[]> {
    if (this.cache.rulesets) {
      return of(this.cache.rulesets);
    } else {
      return this.apiService.get('data/rulesets', false).pipe(
        tap((rulesets: string[]) => {
          this.cache.rulesets = rulesets;
        }),
      );
    }
  }

  getRulesetsGrouped(): Observable<
    [string, { name: string; id: string; desc?: string }[]][]
  > {
    return this.apiService.get('data/rulesetsgrouped', false);
  }

  getRandom(
    count: number,
    ruleset: string,
    format: string,
    options: { tier?: string; banned?: string[] } = {},
  ): Observable<
    Pokemon<{
      tier: string;
      types: string[];
      baseStats: { [key in Stat]: number };
      abilities: string[];
      level: string;
    }>[]
  > {
    return this.apiService.get('data/random', false, {
      count: count.toFixed(0),
      ruleset,
      format,
      ...options,
    });
  }

  getPokemonList(ruleset?: string | null): Observable<OldPokemon[]> {
    if (!ruleset) ruleset = 'Gen9 NatDex';
    if (this.cache.pokemonList[ruleset]) {
      return of(this.cache.pokemonList[ruleset]);
    } else {
      return this.apiService
        .get('data/listpokemon', false, { ruleset: ruleset })
        .pipe(
          tap((list: OldPokemon[]) => {
            this.cache.pokemonList[ruleset] = list;
          }),
        );
    }
  }

  advancesearch(query: string[], ruleset?: string, format?: string) {
    let encodedQuery = encodeURIComponent(query.join(''));
    let params: { [key: string]: string } = { query: encodedQuery };
    if (ruleset) params['ruleset'] = ruleset;
    return this.apiService.get('data/advancesearch', false, params);
  }

  getFormes(ruleset: string, id: string): Observable<OldPokemon[]> {
    if (this.cache.formes[id]) return of(this.cache.formes[id]);
    else {
      return this.apiService.get(`data/${ruleset}/${id}/formes`, false).pipe(
        tap((list: OldPokemon[]) => {
          this.cache.formes[id] = list;
        }),
      );
    }
  }
}

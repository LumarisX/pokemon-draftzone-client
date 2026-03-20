import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DraftPokemon as OldPokemon } from '../interfaces/draft';
import { Pokemon } from '../interfaces/pokemon';
import { StatsTable, Type } from '../data';
import { ApiService } from './api.service';
import { Stat } from '../data';

export type ResultData = {
  id: string;
  name: string;
  types: Type[];
  abilities: string[];
  baseStats: StatsTable;
  weightkg: number;
  tier: string;
  doublesTier: string;
  eggGroups: string[];
  nfe: boolean;
  num: number;
  tags: string[];
  bst: number;
};

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
      return this.apiService.get<string[]>('data/formats').pipe(
        tap((formats: string[]) => {
          this.cache.formats = formats;
        }),
      );
    }
  }

  getFormatsGrouped(): Observable<
    [string, { name: string; id: string; desc?: string }[]][]
  > {
    return this.apiService.get('data/formatsgrouped');
  }

  //replace with ruleset grouped eventually
  getRulesets(): Observable<Ruleset[]> {
    if (this.cache.rulesets) {
      return of(this.cache.rulesets);
    } else {
      return this.apiService.get<string[]>('data/rulesets').pipe(
        tap((rulesets: string[]) => {
          this.cache.rulesets = rulesets;
        }),
      );
    }
  }

  getRulesetsGrouped(): Observable<
    [string, { name: string; id: string; desc?: string }[]][]
  > {
    return this.apiService.get('data/rulesetsgrouped');
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
    return this.apiService.get('data/random', {
      params: {
        count: count.toFixed(0),
        ruleset,
        format,
        ...options,
      },
    });
  }

  getPokemonList(ruleset?: string | null): Observable<OldPokemon[]> {
    if (!ruleset) ruleset = 'Gen9 NatDex';
    if (this.cache.pokemonList[ruleset]) {
      return of(this.cache.pokemonList[ruleset]);
    } else {
      return this.apiService
        .get<OldPokemon[]>('data/listpokemon', { params: { ruleset: ruleset } })
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
    return this.apiService.get<ResultData[]>('data/advancesearch', { params });
  }

  pokemonSearch(
    query: string | string[] | Record<string, unknown>,
    ruleset?: string,
    format?: string,
  ) {
    const queryText =
      typeof query === 'string' || Array.isArray(query) ? query : undefined;
    const joinedQueryText = Array.isArray(queryText)
      ? queryText.join('')
      : queryText;

    let parsedQuery: unknown = query;
    if (joinedQueryText !== undefined) {
      parsedQuery = joinedQueryText;
      try {
        parsedQuery = JSON.parse(joinedQueryText);
      } catch {
        parsedQuery = joinedQueryText;
      }
    }

    return this.apiService.post<ResultData[]>('data/pokemonsearch', {
      ruleset,
      query: parsedQuery,
    });
  }

  getFormes(ruleset: string, id: string): Observable<OldPokemon[]> {
    if (this.cache.formes[id]) return of(this.cache.formes[id]);
    else {
      return this.apiService
        .get<OldPokemon[]>(`data/${ruleset}/${id}/formes`)
        .pipe(
          tap((list: OldPokemon[]) => {
            this.cache.formes[id] = list;
          }),
        );
    }
  }
}

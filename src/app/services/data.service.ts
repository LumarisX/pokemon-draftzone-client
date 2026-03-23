import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DraftPokemon as OldPokemon } from '../interfaces/draft';
import { Pokemon } from '../interfaces/pokemon';
import { StatsTable, Type } from '../data';
import { ApiService } from './api.service';
import { Stat } from '../data';

export type PokemonSearchMoveData = {
  id?: string;
  name?: string;
  type?: string;
  category?: string;
  basePower?: number;
  accuracy?: number | boolean;
  pp?: number;
  priority?: number;
  target?: string;
};

export type PokemonFullData = {
  id: string;
  name: string;
  baseSpecies: string;
  gen: number;
  isNonstandard: string;
  types: Type[];
  abilities: string[];
  weaks: string[];
  resists: string[];
  immunities: string[];
  baseStats: StatsTable;
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  weightkg: number;
  tier: string;
  natDexTier: string;
  doublesTier: string;
  eggGroups: string[];
  nfe: boolean;
  evolved: boolean;
  isMega: boolean;
  isPrimal: boolean;
  isGigantamax: boolean;
  prevo: string;
  evos: string[];
  requiredAbility: string;
  requiredItem: string[];
  requiredMove: string;
  coverage: string[];
  learns?: PokemonSearchMoveData[] | string[];
  num: number;
  tags: string[];
  bst: number;
  cst: number;
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
    pokemonList: { [key: string]: PokemonFullData[] };
    formes: { [key: string]: OldPokemon[] };
  } = {
    pokemonList: {},
    formes: {},
  };

  getFormats(): Observable<Format[]> {
    if (this.cache.formats) return of(this.cache.formats);
    return this.apiService.get<string[]>('data/formats').pipe(
      tap((formats: string[]) => {
        this.cache.formats = formats;
      }),
    );
  }

  getFormatsGrouped(): Observable<
    [string, { name: string; id: string; desc?: string }[]][]
  > {
    return this.apiService.get('data/formatsgrouped');
  }

  getRulesets(): Observable<Ruleset[]> {
    if (this.cache.rulesets) return of(this.cache.rulesets);
    return this.apiService.get<string[]>('data/rulesets').pipe(
      tap((rulesets: string[]) => {
        this.cache.rulesets = rulesets;
      }),
    );
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

  getPokemonList(ruleset?: string | null) {
    if (!ruleset) ruleset = 'Gen9 NatDex';
    if (this.cache.pokemonList[ruleset])
      return of(this.cache.pokemonList[ruleset]);
    return this.apiService
      .get<
        PokemonFullData[]
      >('data/listpokemon', { params: { ruleset: ruleset } })
      .pipe(
        tap((list) => {
          this.cache.pokemonList[ruleset] = list;
        }),
      );
  }

  advancesearch(query: string[], ruleset?: string, format?: string) {
    let encodedQuery = encodeURIComponent(query.join(''));
    let params: { [key: string]: string } = { query: encodedQuery };
    if (ruleset) params['ruleset'] = ruleset;
    return this.apiService.get<PokemonFullData[]>('data/advancesearch', {
      params,
    });
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

    return this.apiService.post<{
      results: PokemonFullData[];
      total: number;
      limit: number;
      offset: number;
    }>('data/pokemonsearch', {
      ruleset,
      query: parsedQuery,
    });
  }

  getFormes(ruleset: string, id: string): Observable<OldPokemon[]> {
    if (this.cache.formes[id]) return of(this.cache.formes[id]);
    return this.apiService
      .get<OldPokemon[]>(`data/${ruleset}/${id}/formes`)
      .pipe(
        tap((list: OldPokemon[]) => {
          this.cache.formes[id] = list;
        }),
      );
  }
}

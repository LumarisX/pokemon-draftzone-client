import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Pokemon } from '../interfaces/draft';
import { ApiService } from './api.service';

export type SupporterData = {
  top: {
    all: {
      name: string;
      amount: number;
    }[];
    thirty: {
      name: string;
      amount: number;
    }[];
  };
  tiers: {
    poke: {
      name: string;
      months: number;
    }[];
    premier: {
      name: string;
      months: number;
    }[];
    great: {
      name: string;
      months: number;
    }[];
    ultra: {
      name: string;
      months: number;
    }[];
    luxury: {
      name: string;
      months: number;
    }[];
    master: {
      name: string;
      months: number;
    }[];
  };
};

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private apiService: ApiService) {}

  cache: {
    formats?: string[];
    rulesets?: string[];
    pokemonList: { [key: string]: Pokemon[] };
    formes: { [key: string]: Pokemon[] };
  } = {
    pokemonList: {},
    formes: {},
  };

  //replace with fromat grouped eventually
  getFormats(): Observable<string[]> {
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
  getRulesets(): Observable<string[]> {
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

  getSupporters(): Observable<SupporterData> {
    return this.apiService.get('supporters/', false);
  }

  getRandom(
    count: number,
    ruleset: string,
    format: string,
  ): Observable<Pokemon[]> {
    return this.apiService.get('data/random', false, {
      count: count.toFixed(0),
      ruleset,
      format,
    });
  }

  getPokemonList(ruleset?: string | null): Observable<Pokemon[]> {
    if (!ruleset) ruleset = 'Gen9 NatDex';
    if (this.cache.pokemonList[ruleset]) {
      return of(this.cache.pokemonList[ruleset]);
    } else {
      return this.apiService
        .get('data/listpokemon', false, { ruleset: ruleset })
        .pipe(
          tap((list: Pokemon[]) => {
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

  getFormes(ruleset: string, id: string): Observable<Pokemon[]> {
    if (this.cache.formes[id]) return of(this.cache.formes[id]);
    else {
      return this.apiService.get(`data/${ruleset}/${id}/formes`, false).pipe(
        tap((list: Pokemon[]) => {
          this.cache.formes[id] = list;
        }),
      );
    }
  }
}

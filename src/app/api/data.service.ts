import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Pokemon } from '../interfaces/draft';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private apiService: ApiService) {}

  cache: {
    formats?: string[];
    rulesets?: string[];
  } = {};

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

  getPokemonList(ruleset: string): Observable<{
    species: Pokemon[];
    ruleset: string;
  }> {
    return this.apiService
      .get('data/listpokemon', false, { ruleset: ruleset })
      .pipe(
        tap((response) => {
          // this.cache.rulesets = rulesets;
        }),
      );
  }

  advancesearch(query: string[], ruleset?: string, format?: string) {
    let encodedQuery = encodeURIComponent(query.join(''));
    let params: { [key: string]: string } = { query: encodedQuery };
    if (ruleset) params['ruleset'] = ruleset;
    return this.apiService.get('data/advancesearch', false, params);
  }
}

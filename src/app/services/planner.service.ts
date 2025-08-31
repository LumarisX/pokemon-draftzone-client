import { Injectable, inject } from '@angular/core';
import { PokemonId } from '../data/namedex';
import { ApiService } from './api.service';
import { Observable, map, of } from 'rxjs';
import {
  Summary,
  TypeChart,
  MoveChart,
  Coverage,
} from '../drafts/matchup-overview/matchup-interface';
import { Pokemon } from '../interfaces/draft';
import { Type } from '../data';

export type Planner = {
  summary: Summary;
  typechart: TypeChart;
  movechart: MoveChart;
  coverage: Coverage;
  recommended: {
    all: {
      pokemon: Pokemon[];
      types: Type[][];
    };
    unique: {
      pokemon: Pokemon[];
      types: Type[][];
    };
  };
};

@Injectable({
  providedIn: 'root',
})
export class PlannerService {
  private apiService = inject(ApiService);

  private cacheSize: number = 10;
  private cache: { key: string; data: Planner }[] = new Array(this.cacheSize);
  private currentIndex: number = 0;

  getPlannerDetails(
    team: PokemonId[],
    format: string,
    ruleset: string,
  ): Observable<Planner> {
    const cacheKey = JSON.stringify([ruleset, team]);
    const cachedData = this.cache.find((item) => item && item.key === cacheKey);
    if (cachedData) {
      return of(cachedData.data);
    } else {
      return this.apiService
        .get(`planner`, false, {
          team: team.join(','),
          format: format,
          ruleset: ruleset,
        })
        .pipe(
          map((data: Planner) => {
            this.cache[this.currentIndex] = { key: cacheKey, data: data };
            this.currentIndex = (this.currentIndex + 1) % this.cacheSize;
            return data;
          }),
        );
    }
  }
}

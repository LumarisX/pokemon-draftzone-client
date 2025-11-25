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
import { Type, Stat } from '../data';

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
        .get<Planner>(`planner`, false, {
          team: team.join(','),
          format: format,
          ruleset: ruleset,
        })
        .pipe(
          map((data: Planner) => {
            // Recompute summary stats (mean, median, max)
            // used as client-side fallback in case the backend calculation is off (It is).
            try {
              const stats = data.summary.stats;
              const team = data.summary.team || [];
              const valuesFor = (key: Stat | 'bst') =>
                team
                  .map((t) => {
                    if (key === 'bst') return t.bst ?? 0;
                    return t.baseStats?.[key] ?? 0;
                  })
                  .filter((v) => typeof v === 'number') as number[];

              const computeMean = (arr: number[]) =>
                arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : undefined;

              const computeMedian = (arr: number[]) => {
                if (!arr || arr.length === 0) return undefined;
                const sorted = [...arr].sort((a, b) => a - b);
                const n = sorted.length;
                const mid = Math.floor(n / 2);
                if (n % 2 === 1) {
                  // odd: middle element
                  return sorted[mid];
                } else {
                  // even: average of two middle elements
                  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
                }
              };

              const computeMax = (arr: number[]) => (arr.length ? Math.max(...arr) : undefined);

              const keys: (Stat | 'bst')[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe', 'bst'];
              if (!stats.mean) stats.mean = {} as any;
              if (!stats.median) stats.median = {} as any;
              if (!stats.max) stats.max = {} as any;
              const mean = stats.mean as Record<Stat | 'bst', number | undefined>;
              const median = stats.median as Record<Stat | 'bst', number | undefined>;
              const max = stats.max as Record<Stat | 'bst', number | undefined>;
              for (const k of keys) {
                const vals = valuesFor(k);
                mean[k] = computeMean(vals);
                median[k] = computeMedian(vals);
                max[k] = computeMax(vals);
              }
            } catch (e) {
              // If anything fails, fall back to the server-provided values.
              console.warn('PlannerService: failed to recompute summary stats', e);
            }

            this.cache[this.currentIndex] = { key: cacheKey, data: data };
            this.currentIndex = (this.currentIndex + 1) % this.cacheSize;
            return data;
          }),
        );
    }
  }
}

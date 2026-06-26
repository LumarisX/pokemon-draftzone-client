import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';

type DraftStatsSplitBy = 'none' | 'format' | 'ruleset' | 'format-ruleset';

type PokemonDraftBreakdown = {
  format?: string;
  ruleset?: string;
  count: number;
};

type PokemonDraftCount = {
  id: string;
  count: number;
  breakdown?: PokemonDraftBreakdown[];
};

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private apiService = inject(ApiService);

  // TODO: no "statistics" controller exists server-side at all. Currently
  // 404s — used by statistics.component.ts.
  getDraftStats(options?: {
    format?: string;
    ruleset?: string;
    splitBy?: DraftStatsSplitBy;
  }) {
    return this.apiService.get<{
      filters: {
        format?: string;
        ruleset?: string;
      };
      splitBy: DraftStatsSplitBy;
      totalTeams: number;
      sortedPokemon: PokemonDraftCount[];
      draftedPokemonCount: number;
      uniquePokemonCount: number;
    }>('statistics', {
      params: options,
    });
  }
}

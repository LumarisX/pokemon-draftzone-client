import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

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

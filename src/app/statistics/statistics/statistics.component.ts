import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon } from '../../interfaces/pokemon';
import { StatisticsService } from '../../services/statistics.service';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';

type DraftStatsSplitBy = 'none' | 'format' | 'ruleset' | 'format-ruleset';

interface PokemonDraftBreakdown {
  format?: string;
  ruleset?: string;
  count: number;
}

interface PokemonDraftCount {
  id: string;
  count: number;
  breakdown?: PokemonDraftBreakdown[];
}

interface DraftStatsResponse {
  filters: {
    format?: string;
    ruleset?: string;
  };
  splitBy: DraftStatsSplitBy;
  totalTeams: number;
  sortedPokemon: PokemonDraftCount[];
  draftedPokemonCount: number;
  uniquePokemonCount: number;
}

interface DraftStatsBreakdownView {
  label: string;
  count: number;
  totalSharePercent: number;
  pokemonSharePercent: number;
}

interface DraftStatsPokemonRow {
  rank: number;
  pokemon: Pokemon;
  count: number;
  sharePercent: number;
  barPercent: number;
  breakdowns: DraftStatsBreakdownView[];
}

interface DraftStatsView {
  splitBy: DraftStatsSplitBy;
  totalTeams: number;
  draftedPokemonCount: number;
  uniquePokemonCount: number;
  topPick?: DraftStatsPokemonRow;
  chartRows: DraftStatsPokemonRow[];
  topRows: DraftStatsPokemonRow[];
  allRows: DraftStatsPokemonRow[];
}

@Component({
  selector: 'pdz-statistics',
  imports: [LoadingComponent, SpriteComponent],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss',
})
export class StatisticsComponent implements OnInit, OnDestroy {
  private readonly statisticsService = inject(StatisticsService);
  private readonly destroy$ = new Subject<void>();

  readonly initialRowLimit = 100;
  readonly chartRowLimit = 50;
  singlesShowAll = false;
  vgcShowAll = false;
  singlesLoading = true;
  vgcLoading = true;
  singlesData: DraftStatsView | null = null;
  vgcData: DraftStatsView | null = null;

  ngOnInit(): void {
    this.loadFormatData('Singles');
    this.loadFormatData('VGC');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  toggleSinglesRows(): void {
    this.singlesShowAll = !this.singlesShowAll;
  }

  toggleVgcRows(): void {
    this.vgcShowAll = !this.vgcShowAll;
  }

  visibleRows(data: DraftStatsView, showAll: boolean): DraftStatsPokemonRow[] {
    return showAll ? data.allRows : data.topRows;
  }

  hiddenRowsCount(data: DraftStatsView): number {
    return Math.max(data.allRows.length - this.initialRowLimit, 0);
  }

  private loadFormatData(format: 'Singles' | 'VGC'): void {
    this.statisticsService
      .getDraftStats({ format, splitBy: 'ruleset' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const transformed = this.mapStatsData(data);

          if (format === 'Singles') {
            this.singlesData = transformed;
            this.singlesLoading = false;
            return;
          }

          this.vgcData = transformed;
          this.vgcLoading = false;
        },
        error: () => {
          if (format === 'Singles') {
            this.singlesData = null;
            this.singlesLoading = false;
            return;
          }

          this.vgcData = null;
          this.vgcLoading = false;
        },
      });
  }

  private mapStatsData(data: DraftStatsResponse): DraftStatsView {
    const draftedCount =
      data.draftedPokemonCount ||
      data.sortedPokemon.reduce((total, pokemon) => total + pokemon.count, 0);
    const topCount = data.sortedPokemon[0]?.count ?? 0;

    const allRows = data.sortedPokemon.map((pokemon, index) => {
      const breakdowns = (pokemon.breakdown ?? []).map((breakdown) => ({
        label: this.breakdownLabel(data.splitBy, breakdown),
        count: breakdown.count,
        totalSharePercent:
          draftedCount > 0 ? (breakdown.count / draftedCount) * 100 : 0,
        pokemonSharePercent:
          pokemon.count > 0 ? (breakdown.count / pokemon.count) * 100 : 0,
      }));

      return {
        rank: index + 1,
        pokemon: {
          id: pokemon.id,
          name: this.toPokemonDisplayName(pokemon.id),
        },
        count: pokemon.count,
        sharePercent:
          draftedCount > 0 ? (pokemon.count / draftedCount) * 100 : 0,
        barPercent: topCount > 0 ? (pokemon.count / topCount) * 100 : 0,
        breakdowns,
      };
    });

    return {
      splitBy: data.splitBy,
      totalTeams: data.totalTeams,
      draftedPokemonCount: draftedCount,
      uniquePokemonCount: data.uniquePokemonCount,
      topPick: allRows[0],
      chartRows: allRows.slice(0, this.chartRowLimit),
      topRows: allRows.slice(0, this.initialRowLimit),
      allRows,
    };
  }

  private breakdownLabel(
    splitBy: DraftStatsSplitBy,
    breakdown: PokemonDraftBreakdown,
  ): string {
    if (splitBy === 'format') {
      return breakdown.format || 'Unknown Format';
    }

    if (splitBy === 'ruleset') {
      return breakdown.ruleset || 'Unknown Ruleset';
    }

    if (splitBy === 'format-ruleset') {
      return `${breakdown.format || 'Unknown Format'} / ${
        breakdown.ruleset || 'Unknown Ruleset'
      }`;
    }

    return 'Total';
  }

  private toPokemonDisplayName(id: string): string {
    return id
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}

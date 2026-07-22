import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Stat, StatsTable } from '@pdz/shared/data';
import {
  Summary,
  SummaryPokemon,
} from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { SliderComponent } from '@pdz/shared/inputs/slider/slider.component';
import { typeColor } from '@pdz/core/utils/styling';

type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'bst' | 'cst';
type AggregateKey = 'mean' | 'median' | 'max';

/** The values actually rendered for a row: the active forme resolved over its base Pokemon. */
interface ActiveForme {
  name: string;
  types: string[];
  abilities: string[];
  baseStats: StatsTable;
  bst: number;
  cst: number;
}

interface SortState {
  active: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'pdz-summary-core',
  templateUrl: './summary-core.component.html',
  styleUrl: './summary-core.component.scss',
  imports: [CommonModule, FormsModule, SpriteComponent, SliderComponent],
})
export class SummaryCoreComponent {
  baseValue: number = 80;
  private summaryData = new BehaviorSubject<Summary | null>(null);

  currentSort: SortState = { active: 'spe', direction: 'desc' };
  sortSubject = new BehaviorSubject<SortState>(this.currentSort);

  readonly statColumns: { key: StatKey; label: string }[] = [
    { key: 'hp', label: 'HP' },
    { key: 'atk', label: 'ATK' },
    { key: 'def', label: 'DEF' },
    { key: 'spa', label: 'SPA' },
    { key: 'spd', label: 'SPD' },
    { key: 'spe', label: 'SPE' },
    { key: 'bst', label: 'BST' },
    { key: 'cst', label: 'CST' },
  ];

  readonly aggregateRows: { key: AggregateKey; label: string }[] = [
    { key: 'mean', label: 'Average' },
    { key: 'median', label: 'Median' },
    { key: 'max', label: 'Max' },
  ];

  @Input()
  set summary(value: Summary | undefined | null) {
    if (!value) {
      return;
    }
    this.summaryData.next(value);
  }

  get summary(): Summary | null {
    return this.summaryData.getValue();
  }

  readonly sortedTeam$ = combineLatest([
    this.summaryData.asObservable(),
    this.sortSubject.asObservable(),
  ]).pipe(
    map(([summary, sort]) => {
      if (!summary?.team) return [];
      const teamData = [...summary.team];
      const isAsc = sort.direction === 'asc';

      return teamData.sort((a, b) => {
        const aValue = this.getStatValue(a, sort.active);
        const bValue = this.getStatValue(b, sort.active);
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return comparison * (isAsc ? 1 : -1);
      });
    }),
  );

  public readonly typeColor = typeColor;

  toggleSort(active: string): void {
    let direction: 'asc' | 'desc';
    if (this.currentSort.active === active) {
      direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      direction = active === 'name' ? 'asc' : 'desc';
    }
    this.currentSort = { active, direction };
    this.sortSubject.next(this.currentSort);
  }

  /** Index 0 is the base Pokemon; 1..N map onto draftFormes. */
  activeForme(pokemon: SummaryPokemon): ActiveForme {
    const index = pokemon.formeIndex ?? 0;
    const forme = index > 0 ? pokemon.draftFormes?.[index - 1] : undefined;
    if (!forme) return pokemon;

    // Formes only carry what differs, so fall back to the base Pokemon.
    return {
      name: forme.name,
      types: forme.types ?? pokemon.types,
      abilities: forme.abilities ?? pokemon.abilities,
      baseStats: forme.baseStats ?? pokemon.baseStats,
      bst: forme.bst ?? pokemon.bst,
      cst: forme.cst ?? pokemon.cst,
    };
  }

  setFormeIndex(pokemon: SummaryPokemon, index: number): void {
    pokemon.formeIndex = index;
  }

  statValue(source: ActiveForme, key: StatKey): number | undefined {
    if (key === 'bst') return source.bst;
    if (key === 'cst') return source.cst;
    return source.baseStats[key as Stat];
  }

  statCellColor(source: ActiveForme, key: StatKey): string | undefined {
    const value = this.statValue(source, key);
    return this.isTotal(key) ? this.bstColor(value) : this.statColor(value);
  }

  /** Computed over each Pokemon's active forme so the aggregates track forme
   * rotation, rather than reading the server's base-team precomputation.
   * Rounding mirrors the server so the initial (all base) render is identical. */
  aggregateValue(row: AggregateKey, key: StatKey): number | undefined {
    const team = this.summary?.team;
    if (!team?.length) return undefined;

    const values = team
      .map((pokemon) => this.statValue(this.activeForme(pokemon), key))
      .filter((value): value is number => value !== undefined);
    if (!values.length) return undefined;

    switch (row) {
      case 'mean':
        return Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        );
      case 'median': {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : sorted[mid];
      }
      case 'max':
        return Math.max(...values);
    }
  }

  aggregateColor(row: AggregateKey, key: StatKey): string | undefined {
    const value = this.aggregateValue(row, key);
    return this.isTotal(key) ? this.bstColor(value) : this.statColor(value);
  }

  private isTotal(key: StatKey): boolean {
    return key === 'bst' || key === 'cst';
  }

  statColor(statValue: number | undefined): string | undefined {
    if (statValue === undefined) return undefined;
    const diff = statValue - this.baseValue;
    if (Math.abs(diff) <= 7) return 'var(--pdz-color-scale-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    const level = Math.min(Math.floor((Math.abs(diff) - 8) / 15) + 1, 5);
    return `var(--pdz-color-scale-${sign}-${level})`;
  }

  bstColor(bstValue: number | undefined): string | undefined {
    if (bstValue === undefined) return undefined;
    const diff = bstValue - this.baseValue * 6;
    if (diff > -25 && diff <= 0) return 'var(--pdz-color-scale-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    let level: number;
    if (diff > 0) {
      level = Math.floor(diff / 25) + 1;
    } else {
      level = Math.floor((Math.abs(diff) - 1) / 25) + 1;
    }
    return `var(--pdz-color-scale-${sign}-${Math.min(level, 7)})`;
  }

  cstColor(cstValue: number | undefined): string | undefined {
    if (cstValue === undefined) return undefined;
    const diff = cstValue - this.baseValue * 4;
    if (diff > -25 && diff <= 0) return 'var(--pdz-color-scale-neutral)';
    const sign = diff > 0 ? 'positive' : 'negative';
    let level: number;
    if (diff > 0) {
      level = Math.floor(diff / 25) + 1;
    } else {
      level = Math.floor((Math.abs(diff) - 1) / 25) + 1;
    }
    return `var(--pdz-color-scale-${sign}-${Math.min(level, 7)})`;
  }

  private getStatValue(pokemon: any, stat: string): number | string {
    switch (stat) {
      case 'name':
        return pokemon.name;
      case 'bst':
        return pokemon.bst;
      case 'cst':
        return pokemon.cst;
      default:
        return pokemon.baseStats[stat as Stat];
    }
  }
}

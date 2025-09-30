import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule, Sort } from '@angular/material/sort';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Stat } from '../../../data';
import { Summary } from '../../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { typeColor } from '../../styling';

@Component({
  selector: 'summary-core',
  standalone: true,
  templateUrl: './summary-core.component.html',
  styleUrl: './summary-core.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    CdkTableModule,
    MatSortModule,
    MatSliderModule,
  ],
})
export class SummaryCoreComponent {
  // --- Class Properties ---

  baseValue: number = 80;
  private summaryData = new BehaviorSubject<Summary | null>(null);
  private sortSubject = new BehaviorSubject<Sort>({
    active: 'spe',
    direction: 'desc',
  });

  // --- Inputs & Outputs ---

  @Input()
  set summary(value: Summary | undefined | null) {
    // FIX: This guard prevents the component from clearing its data if the parent
    // component passes a null/undefined value (e.g., during a loading state).
    if (!value) {
      return;
    }
    this.summaryData.next(value);
  }

  get summary(): Summary | null {
    return this.summaryData.getValue();
  }

  // --- Observables for Template ---

  readonly sortedTeam$ = combineLatest([
    this.summaryData.asObservable(),
    this.sortSubject.asObservable(),
  ]).pipe(
    map(([summary, sort]) => {
      if (!summary?.team) return [];
      // When summaryData is null initially, we need a default sort.
      // If no sort is active, return the team as-is (or default sorted).
      if (!sort.active || sort.direction === '') {
        const defaultSorted = [...summary.team];
        return defaultSorted.sort((a, b) => b.baseStats.spe - a.baseStats.spe);
      }

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

  // --- Public Properties & Methods ---

  public readonly typeColor = typeColor;

  displayedColumns: string[] = [
    'sprite',
    'name',
    'abilities',
    'hp',
    'atk',
    'def',
    'spa',
    'spd',
    'spe',
    'bst',
  ];

  sort(sortState: Sort): void {
    this.sortSubject.next(sortState);
  }

  statColor(statValue: number | undefined): string | undefined {
    if (statValue === undefined) return undefined;
    const diff = statValue - this.baseValue;
    if (Math.abs(diff) <= 7) return 'var(--pdz-colors-menu-200)';
    const sign = diff > 0 ? 'positive' : 'negative';
    const level = Math.min(Math.floor((Math.abs(diff) - 8) / 15) + 1, 5);
    return `var(--pdz-colors-scale-${sign}-${level})`;
  }

  bstColor(bstValue: number | undefined): string | undefined {
    if (bstValue === undefined) return undefined;
    const diff = bstValue - this.baseValue * 6;
    if (diff > -25 && diff <= 0) return 'var(--pdz-colors-menu-200)';
    const sign = diff > 0 ? 'positive' : 'negative';
    let level: number;
    if (diff > 0) {
      level = Math.floor(diff / 25) + 1;
    } else {
      level = Math.floor((Math.abs(diff) - 1) / 25) + 1;
    }
    return `var(--pdz-colors-scale-${sign}-${Math.min(level, 7)})`;
  }

  // --- Private Helper Methods ---

  private getStatValue(pokemon: any, stat: string): number | string {
    switch (stat) {
      case 'name':
        return pokemon.name;
      case 'bst':
        return pokemon.bst;
      default:
        return pokemon.baseStats[stat as Stat];
    }
  }
}

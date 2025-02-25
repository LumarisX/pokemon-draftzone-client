import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Summary } from '../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { BehaviorSubject, map } from 'rxjs';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatSliderModule } from '@angular/material/slider';
import { Stat } from '../../data';
import { typeColor } from '../../util/styling';

@Component({
  selector: 'planner-summary',
  standalone: true,
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SpriteComponent,
    CdkTableModule,
    MatSortModule,
    MatSliderModule,
  ],
})
export class PlannerSummaryComponent implements OnInit {
  sortBy: 'name' | Stat | 'bst' | null = null;

  private sortBySubject = new BehaviorSubject<{
    value: 'name' | Stat | 'bst' | null;
    reversed: boolean;
  }>({
    value: null,
    reversed: false,
  });

  @Input()
  set summary(value: Summary | undefined) {
    if (!value) return;
    value.team.sort((x, y) => y.baseStats.spe - x.baseStats.spe);
    this.sortBy = 'spe';
    this.summaryData.next(value);
  }

  get summary(): Summary | null {
    return this.summaryData.value;
  }

  reversed: boolean = false;
  baseValue: number = 80;

  summaryData = new BehaviorSubject<Summary | null>(null);

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

  ngOnInit(): void {}

  sortedTeam$ = this.summaryData.asObservable().pipe(
    map((summary) => {
      if (!summary) return [];
      const { value, reversed } = this.sortBySubject.value;

      if (!value) return summary.team;

      return [...summary.team].sort((a, b) => {
        let comparison = 0;
        if (value === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (value === 'bst') {
          comparison = a.bst - b.bst;
        } else {
          comparison = a.baseStats[value] - b.baseStats[value];
        }
        return reversed ? -comparison : comparison;
      });
    }),
  );

  typeColor = typeColor;

  sort(sort: Sort) {
    if (!this.summaryData.value) return;
    const isAsc = sort.direction === 'asc';
    const compare = (
      a: number | string | null | undefined,
      b: number | string | null | undefined,
    ) => {
      if (a == null) return 1;
      if (b == null) return -1;
      return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b) * (isAsc ? 1 : -1)
        : (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    };
    const sortedTeam = [...this.summaryData.value.team].sort((a, b) => {
      switch (sort.active) {
        case 'name':
          return compare(a.name, b.name);
        case 'hp':
          return compare(a.baseStats.hp, b.baseStats.hp);
        case 'atk':
          return compare(a.baseStats.atk, b.baseStats.atk);
        case 'def':
          return compare(a.baseStats.def, b.baseStats.def);
        case 'spa':
          return compare(a.baseStats.spa, b.baseStats.spa);
        case 'spd':
          return compare(a.baseStats.spd, b.baseStats.spd);
        case 'spe':
          return compare(a.baseStats.spe, b.baseStats.spe);
        case 'bst':
          return compare(a.bst, b.bst);
        default:
          return 0;
      }
    });
    this.summaryData.next({ ...this.summaryData.value, team: sortedTeam });
  }

  statColor(statValue: number | undefined) {
    if (statValue === undefined) {
      return;
    }
    if (statValue > this.baseValue + 67) return 'bg-scale-positive-5';
    if (statValue > this.baseValue + 52) return 'bg-scale-positive-4';
    if (statValue > this.baseValue + 37) return 'bg-scale-positive-3';
    if (statValue > this.baseValue + 22) return 'bg-scale-positive-2';
    if (statValue > this.baseValue + 7) return 'bg-scale-positive-1';
    if (statValue < this.baseValue + 8 && statValue > this.baseValue - 8)
      return 'bg-menu-200';
    if (statValue < this.baseValue - 67) return 'bg-scale-negative-5';
    if (statValue < this.baseValue - 52) return 'bg-scale-negative-4';
    if (statValue < this.baseValue - 37) return 'bg-scale-negative-3';
    if (statValue < this.baseValue - 22) return 'bg-scale-negative-2';
    if (statValue < this.baseValue - 7) return 'bg-scale-negative-1';
    return;
  }

  bstColor(bstValue: number | undefined): string | undefined {
    if (bstValue === undefined) return;
    const diff = bstValue - this.baseValue * 6;
    if (diff > 150) return 'bg-scale-positive-7';
    if (diff > 125) return 'bg-scale-positive-6';
    if (diff > 100) return 'bg-scale-positive-5';
    if (diff > 75) return 'bg-scale-positive-4';
    if (diff > 50) return 'bg-scale-positive-3';
    if (diff > 25) return 'bg-scale-positive-2';
    if (diff > 0) return 'bg-scale-positive-1';
    if (diff > -25) return 'bg-menu-200';
    if (diff < -175) return 'bg-scale-negative-7';
    if (diff < -150) return 'bg-scale-negative-6';
    if (diff < -125) return 'bg-scale-negative-5';
    if (diff < -100) return 'bg-scale-negative-4';
    if (diff < -75) return 'bg-scale-negative-3';
    if (diff < -50) return 'bg-scale-negative-2';
    return 'bg-scale-negative-1';
  }
}

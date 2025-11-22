import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  Subject,
  takeUntil,
} from 'rxjs';
import { TYPES } from '../../../../data';
import {
  TypeChart,
  TypeChartPokemon,
} from '../../../../drafts/matchup-overview/matchup-interface';
import { typeColor } from '../../../styling';

type ScoreRange = {
  min: number;
  max: number;
  colorClass: string;
};

@Component({
  selector: 'pdz-typestats-core',
  templateUrl: './typestats-core.component.html',
  styleUrl: './typestats-core.component.scss',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatTooltipModule],
})
export class TypestatsCoreComponent implements OnInit, OnDestroy {
  sortedTeam = new BehaviorSubject<TypeChartPokemon[]>([]);
  private destroy$ = new Subject<void>();
  $typechart = new BehaviorSubject<TypeChart | null>(null);

  @Input()
  set typechart(value: TypeChart | undefined | null) {
    this.$typechart.next(value ?? null);
    if (value) this.sortedTeam.next([...value.team]);
  }

  @Input()
  scoringRanges: {
    weak: ScoreRange[];
    resist: ScoreRange[];
    count: ScoreRange[];
    diff: ScoreRange[];
  } = {
    weak: [
      { min: 6, max: Infinity, colorClass: 'pdz-scale-negative-5' },
      { min: 5, max: 6, colorClass: 'pdz-scale-negative-4' },
      { min: 4, max: 5, colorClass: 'pdz-scale-negative-3' },
      { min: 3, max: 4, colorClass: 'pdz-scale-neutral' },
      { min: 2, max: 3, colorClass: 'pdz-scale-positive-3' },
      { min: 1, max: 2, colorClass: 'pdz-scale-positive-4' },
      { min: -Infinity, max: 1, colorClass: 'pdz-scale-positive-5' },
    ],
    resist: [
      { min: 5, max: Infinity, colorClass: 'pdz-scale-positive-5' },
      { min: 4, max: 5, colorClass: 'pdz-scale-positive-4' },
      { min: 3, max: 4, colorClass: 'pdz-scale-positive-3' },
      { min: 2, max: 3, colorClass: 'pdz-scale-neutral' },
      { min: 1, max: 2, colorClass: 'pdz-scale-negative-3' },
      { min: -Infinity, max: 1, colorClass: 'pdz-scale-negative-4' },
    ],
    count: [
      { min: 4, max: Infinity, colorClass: 'pdz-scale-negative-5' },
      { min: 3, max: 4, colorClass: 'pdz-scale-negative-4' },
      { min: 2, max: 3, colorClass: 'pdz-scale-neutral' },
      { min: 1, max: 2, colorClass: 'pdz-scale-positive-4' },
      { min: -Infinity, max: 1, colorClass: 'pdz-scale-neutral' },
    ],
    diff: [
      { min: 4, max: Infinity, colorClass: 'pdz-scale-positive-6' },
      { min: 3, max: 4, colorClass: 'pdz-scale-positive-5' },
      { min: 2, max: 3, colorClass: 'pdz-scale-positive-4' },
      { min: 1, max: 2, colorClass: 'pdz-scale-positive-3' },
      { min: 0, max: 1, colorClass: 'pdz-scale-neutral' },
      { min: -1, max: 0, colorClass: 'pdz-scale-negative-3' },
      { min: -2, max: -1, colorClass: 'pdz-scale-negative-4' },
      { min: -Infinity, max: -2, colorClass: 'pdz-scale-negative-5' },
    ],
  };

  get typechart() {
    return this.$typechart.value;
  }

  types = TYPES;

  counts: number[] = [];
  weaknesses: number[] = [];
  resistances: number[] = [];
  delta: number[] = [];
  logDelta: number[] = [];

  @Input()
  set abilities(value: boolean) {
    this.abilityIndex = value ? 0 : 1;
    this.summarize();
  }

  abilityIndex: number = 0;
  columnHovered = new BehaviorSubject<string | null>(null);
  get abilities() {
    return !this.abilityIndex;
  }

  ngOnInit(): void {
    this.$typechart
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.summarize(value?.team);
      });

    this.columnHovered
      .pipe(debounceTime(50), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => this.columnHovered.next(value));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  typeColor = typeColor;

  public summarize(team: TypeChartPokemon[] = this.sortedTeam.value): void {
    const newValues = this.types.map(() => ({
      weaknesses: 0,
      resistances: 0,
      difference: 0,
      differential: 0,
      counts: 0,
    }));
    team.forEach((pokemon) => {
      if (!pokemon.disabled) {
        this.types.forEach((type, index) => {
          if (pokemon.types.includes(type)) newValues[index].counts++;
          const weakValue = pokemon.weak[this.abilityIndex][type];
          if (weakValue > 1) {
            newValues[index].weaknesses++;
            newValues[index].difference--;
          } else if (weakValue < 1) {
            newValues[index].resistances++;
            newValues[index].difference++;
          }
          newValues[index].differential +=
            weakValue > 0 ? -Math.log2(weakValue) : 2;
        });
      }
    });
    this.weaknesses = newValues.map((v) => v.weaknesses);
    this.resistances = newValues.map((v) => v.resistances);
    this.delta = newValues.map((v) => v.difference);
    this.logDelta = newValues.map((v) => v.differential);
    this.counts = newValues.map((v) => v.counts);
  }

  weakColor(weak: number): string {
    return this.getColorFromRanges(weak, this.scoringRanges.weak);
  }

  resistColor(resist: number): string {
    return this.getColorFromRanges(resist, this.scoringRanges.resist);
  }

  countColor(count: number): string {
    return this.getColorFromRanges(count, this.scoringRanges.count);
  }

  diffColor(diff: number): string {
    return this.getColorFromRanges(diff, this.scoringRanges.diff);
  }

  private getColorFromRanges(value: number, ranges: ScoreRange[]): string {
    for (const range of ranges) {
      if (value >= range.min && value < range.max) {
        return range.colorClass;
      }
    }
    return 'pdz-scale-neutral';
  }
}

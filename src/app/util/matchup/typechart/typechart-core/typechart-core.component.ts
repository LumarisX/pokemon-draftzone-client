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
  tap,
} from 'rxjs';
import { Type, TYPES } from '../../../../data';
import {
  TypeChart,
  TypeChartPokemon,
} from '../../../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { typeColor } from '../../../styling';

@Component({
  selector: 'typechart-core',
  standalone: true,
  templateUrl: './typechart-core.component.html',
  styleUrl: '../typechart-core.component.scss',
  imports: [
    CommonModule,
    SpriteComponent,
    FormsModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
})
export class TypechartCoreComponent implements OnInit, OnDestroy {
  sortedTeam = new BehaviorSubject<TypeChartPokemon[]>([]);
  private destroy$ = new Subject<void>();
  $typechart = new BehaviorSubject<TypeChart | null>(null);

  @Input()
  set typechart(value: TypeChart | undefined | null) {
    this.$typechart.next(value ?? null);
    if (value) this.sortedTeam.next([...value.team]);
  }

  get typechart() {
    return this.$typechart.value;
  }

  types = TYPES;

  displayedColumns: string[] = ['label', ...this.types];

  @Input() recommended?: {
    all: {
      pokemon: Pokemon[];
      types: Type[][];
    };
    unique: {
      pokemon: Pokemon[];
      types: Type[][];
    };
  };
  counts: number[] = [];
  weaknesses: number[] = [];
  resistances: number[] = [];
  difference: number[] = [];
  differential: number[] = [];
  uniqueSelected: boolean = true;

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
    this.sortedBy
      .pipe(
        distinctUntilChanged(),
        tap((value) => {
          this.sort(value);
          this.summarize();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

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

  sortedBy = new BehaviorSubject<string | null>(null);

  setSort(value: string | null) {
    this.sortedBy.next(value === this.sortedBy.value ? null : value);
  }

  typeColor = typeColor;

  compare = (
    a: number | string | null | undefined,
    b: number | string | null | undefined,
  ) => {
    if (a == null) return 1;
    if (b == null) return -1;
    return typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b)
      : a < b
        ? -1
        : 1;
  };

  sort(sortBy: string | null) {
    if (!this.typechart) return;
    if (!sortBy) {
      this.sortedTeam.next([...this.typechart.team]);
    }

    this.sortedTeam.next(
      [...this.sortedTeam.value].sort((a, b) => {
        if (!sortBy) return 0;
        if (sortBy in a.weak[this.abilityIndex]) {
          return this.compare(
            a.weak[this.abilityIndex][sortBy as Type],
            b.weak[this.abilityIndex][sortBy as Type],
          );
        }
        return 0;
      }),
    );
  }

  toggleVisible(pokemon: TypeChartPokemon) {
    pokemon.disabled = !pokemon.disabled;
    this.summarize();
  }

  summarize(team: TypeChartPokemon[] = this.sortedTeam.value): void {
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
    this.difference = newValues.map((v) => v.difference);
    this.differential = newValues.map((v) => v.differential);
    this.counts = newValues.map((v) => v.counts);
  }

  weaknessColor(weak: number, disabled: boolean): string[] {
    if (disabled) {
      return ['text-transparent'];
    }
    const classes: string[] = ['type-colored'];
    if (weak > 4) classes.push('bg-scale-negative-5');
    else if (weak > 2) classes.push('bg-scale-negative-4');
    else if (weak > 1) classes.push('bg-scale-negative-3');
    else if (weak < 0.25) classes.push('bg-scale-positive-5');
    else if (weak < 0.5) classes.push('bg-scale-positive-4');
    else if (weak < 1) classes.push('bg-scale-positive-3');
    else return ['type-empty'];
    return classes;
  }

  weakColor(weak: number): string {
    if (weak > 5) return 'bg-scale-negative-5';
    if (weak > 4) return 'bg-scale-negative-4';
    if (weak > 3) return 'bg-scale-negative-3';
    if (weak < 1) return 'bg-scale-positive-5';
    if (weak < 2) return 'bg-scale-positive-4';
    if (weak < 3) return 'bg-scale-positive-3';
    return 'stat-neutral';
  }

  resistColor(weak: number): string {
    if (weak > 4) return 'bg-scale-positive-5';
    if (weak > 3) return 'bg-scale-positive-4';
    if (weak > 2) return 'bg-scale-positive-3';
    if (weak < 1) return 'bg-scale-negative-4';
    if (weak < 2) return 'bg-scale-negative-3';
    return 'stat-neutral';
  }

  countColor(count: number): string {
    if (count > 3) return 'bg-scale-negative-5';
    if (count > 2) return 'bg-scale-negative-4';
    if (count > 1) return 'stat-neutral';
    if (count > 0) return 'bg-scale-positive-4';
    return 'stat-neutral';
  }

  diffColor(weak: number): string {
    if (weak > 3) return 'bg-scale-positive-6';
    if (weak > 2) return 'bg-scale-positive-5';
    if (weak > 1) return 'bg-scale-positive-4';
    if (weak > 0) return 'bg-scale-positive-3';
    if (weak < -2) return 'bg-scale-negative-5';
    if (weak < -1) return 'bg-scale-negative-4';
    if (weak < 0) return 'bg-scale-negative-3';
    return 'stat-neutral';
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { Pokemon } from '../../../../interfaces/draft';
import { typeColor } from '../../../styling';

@Component({
  selector: 'pdz-typestats-core',
  standalone: true,
  templateUrl: './typestats-core.component.html',
  styleUrl: '../typechart-core.component.scss',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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

  get typechart() {
    return this.$typechart.value;
  }

  types = TYPES;

  counts: number[] = [];
  weaknesses: number[] = [];
  resistances: number[] = [];
  difference: number[] = [];
  differential: number[] = [];

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
    console.log('suming');
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

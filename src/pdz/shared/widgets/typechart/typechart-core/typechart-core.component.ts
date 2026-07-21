import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
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
import { Type, TYPES } from '@pdz/shared/data';
import {
  TypeChart,
  TypeChartPokemon,
} from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { typeColor } from '@pdz/core/utils/styling';

@Component({
  selector: 'pdz-typechart-core',
  templateUrl: './typechart-core.component.html',
  styleUrl: './typechart-core.component.scss',
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

  @Input()
  set abilities(value: boolean) {
    this.abilityIndex = value ? 0 : 1;
  }

  @Output()
  togglePokemon = new EventEmitter<TypeChartPokemon>();

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
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this.$typechart
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {});

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
        const aWeak = this.activeWeak(a);
        const bWeak = this.activeWeak(b);
        if (sortBy in aWeak) {
          return this.compare(aWeak[sortBy as Type], bWeak[sortBy as Type]);
        }
        return 0;
      }),
    );
  }

  activeWeak(pokemon: TypeChartPokemon) {
    const formeIndex = pokemon.formeIndex ?? 0;
    const forme =
      formeIndex > 0 ? pokemon.draftFormes?.[formeIndex - 1] : undefined;
    return (forme?.weak ?? pokemon.weak)[this.abilityIndex];
  }

  weaknessColor(weak: number, disabled: boolean): string {
    if (disabled) {
      if (weak > 4) return 'pdz-scale-inverse-negative-5';
      if (weak > 2) return 'pdz-scale-inverse-negative-4';
      if (weak > 1) return 'pdz-scale-inverse-negative-3';
      if (weak < 0.25) return 'pdz-scale-inverse-positive-5';
      if (weak < 0.5) return 'pdz-scale-inverse-positive-4';
      if (weak < 1) return 'pdz-scale-inverse-positive-3';
      return 'pdz-scale-inverse-neutral';
    }
    if (weak > 4) return 'pdz-scale-negative-5';
    if (weak > 2) return 'pdz-scale-negative-4';
    if (weak > 1) return 'pdz-scale-negative-3';
    if (weak < 0.25) return 'pdz-scale-positive-5';
    if (weak < 0.5) return 'pdz-scale-positive-4';
    if (weak < 1) return 'pdz-scale-positive-3';
    return 'pdz-scale-neutral';
  }
}

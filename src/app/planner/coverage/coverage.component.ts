import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TYPES } from '../../data';
import {
  Coverage,
  CoveragePokemon,
} from '../../drafts/matchup-overview/matchup-interface';
import { CoverageChartComponent } from './coverage-chart/coverage-chart.component';
import { CoverageTeamChartComponent } from './coverage-chart/coverage-team-chart.component';
import {
  BehaviorSubject,
  debounceTime,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'planner-coverage',
  standalone: true,
  templateUrl: './coverage.component.html',
  styleUrl: './coverage.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CoverageChartComponent,
    CoverageTeamChartComponent,
    MatSliderModule,
  ],
})
export class PlannerCoverageComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  coverage$ = new BehaviorSubject<Coverage | null>(null);
  @Input() set coverage(value: Coverage | null) {
    this.coverage$.next(value);
    this.selected = null;
  }

  get coverage() {
    return this.coverage$.value;
  }
  types = TYPES;
  selected: CoveragePokemon | null = null;

  sliderControl = new FormControl(60);
  maxPower: number = 60;

  ngOnInit(): void {
    this.sliderControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value !== null) this.maxPower = value;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  coverageColor(value: number | undefined): string | string[] {
    const MID = 7000;
    if (!value) return 'bg-scale-negative-7';
    if (value > MID + 7000) return 'bg-scale-positive-7';
    if (value > MID + 6000) return 'bg-scale-positive-6';
    if (value > MID + 5000) return 'bg-scale-positive-5';
    if (value > MID + 4000) return 'bg-scale-positive-4';
    if (value > MID + 3000) return 'bg-scale-positive-3';
    if (value > MID + 2000) return 'bg-scale-positive-2';
    if (value > MID + 1000) return 'bg-scale-positive-1';
    if (value > MID) return 'bg-gray-400';
    if (value > MID - 1000) return 'bg-scale-negative-1';
    if (value > MID - 2000) return 'bg-scale-negative-2';
    if (value > MID - 3000) return 'bg-scale-negative-3';
    if (value > MID - 4000) return 'bg-scale-negative-4';
    if (value > MID - 5000) return 'bg-scale-negative-5';
    if (value > MID - 6000) return 'bg-scale-negative-6';
    return 'bg-scale-negative-7';
  }
}

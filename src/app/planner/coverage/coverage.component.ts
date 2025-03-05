import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Type, TYPES } from '../../data';
import {
  Coverage,
  CoveragePokemon,
} from '../../drafts/matchup-overview/matchup-interface';
import { CoverageChartComponent } from './charts/coverage-chart.component';
import { CoverageTeamChartComponent } from './charts/coverage-team-chart.component';
import {
  BehaviorSubject,
  debounceTime,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { CoverageChartPreviewComponent } from './charts/coverage-chart-preview.component';

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
    CoverageChartPreviewComponent,
    MatSliderModule,
    MatTabsModule,
    MatIconModule,
  ],
})
export class PlannerCoverageComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  coverage$ = new BehaviorSubject<Coverage | null>(null);
  @Input() set coverage(value: Coverage | null) {
    this.coverage$.next(value);
    this.selected = value?.team[0] || null;
    this.updateTeamData();
  }

  get coverage() {
    return this.coverage$.value;
  }
  types = TYPES;
  selected!: CoveragePokemon | null;

  sliderControl = new FormControl(60);
  category = new BehaviorSubject<string>('mixed');
  category$ = this.category.asObservable();
  teamData!: { color: string; teamData: { type: Type; value: number }[] };

  ngOnInit(): void {
    this.updateTeamData();
    this.sliderControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value !== null && this.coverage) {
          this.updateTeamData();
        }
      });

    this.category$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value !== null && this.coverage) {
          this.updateTeamData();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateTeamData() {
    const category = this.category.value;
    this.teamData = {
      teamData:
        category === 'physical' || category === 'special'
          ? TYPES.map((type) => ({
              type,
              value: this.coverage!.team.reduce(
                (sum, mon) =>
                  sum +
                  (mon.fullcoverage[category][type] &&
                  mon.fullcoverage[category][type].some(
                    (move) =>
                      +move.basePower >= (this.sliderControl.value ?? 0),
                  )
                    ? 1
                    : 0),
                0,
              ),
            }))
          : TYPES.map((type) => ({
              type,
              value: Math.max(
                this.coverage!.team.reduce(
                  (sum, mon) =>
                    sum +
                    (mon.fullcoverage.physical[type] &&
                    mon.fullcoverage.physical[type].some(
                      (move) =>
                        +move.basePower >= (this.sliderControl.value ?? 0),
                    )
                      ? 1
                      : 0),
                  0,
                ),
                this.coverage!.team.reduce(
                  (sum, mon) =>
                    sum +
                    (mon.fullcoverage.special[type] &&
                    mon.fullcoverage.special[type].some(
                      (move) =>
                        +move.basePower >= (this.sliderControl.value ?? 0),
                    )
                      ? 1
                      : 0),
                  0,
                ),
              ),
            })),
      color:
        category === 'physical'
          ? '#EF6845'
          : category === 'special'
            ? '#61ADF3'
            : '#eb47a4',
    };
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

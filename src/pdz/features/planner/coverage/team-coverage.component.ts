import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Type, TYPES } from '@pdz/shared/data';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SliderComponent } from '@pdz/shared/inputs/slider/slider.component';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { Coverage } from '../../drafts/matchup-overview/matchup-interface';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { CoverageTeamChartComponent } from './charts/coverage-team-chart.component';

@Component({
  selector: 'pdz-planner-team-coverage',
  templateUrl: './team-coverage.component.html',
  styleUrl: './team-coverage.component.scss',
  imports: [
    ReactiveFormsModule,
    CoverageTeamChartComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SliderComponent,
    WidgetComponent,
  ],
})
export class PlannerTeamCoverageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private _coverage: Coverage | null = null;

  @Input() set coverage(value: Coverage | null) {
    this._coverage = value;
    this.updateTeamData();
  }

  get coverage(): Coverage | null {
    return this._coverage;
  }

  sliderControl = new FormControl(60);
  category = new FormControl('mixed', { nonNullable: true });
  teamData!: { color: string; teamData: { type: Type; value: number }[] };

  ngOnInit(): void {
    this.updateTeamData();

    this.sliderControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.updateTeamData());

    this.category.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.updateTeamData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTeamData(): void {
    const coverage = this._coverage;
    if (!coverage) return;

    const category = this.category.value;
    const minBp = this.sliderControl.value ?? 0;

    const countFor = (key: 'physical' | 'special', type: Type): number =>
      coverage.team.reduce(
        (sum, mon) =>
          sum +
          (mon.fullcoverage[key][type]?.some(
            (move) => +move.basePower >= minBp,
          )
            ? 1
            : 0),
        0,
      );

    this.teamData = {
      teamData:
        category === 'physical' || category === 'special'
          ? TYPES.map((type) => ({
              type,
              value: countFor(category, type),
            }))
          : TYPES.map((type) => ({
              type,
              value: Math.max(
                countFor('physical', type),
                countFor('special', type),
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
}

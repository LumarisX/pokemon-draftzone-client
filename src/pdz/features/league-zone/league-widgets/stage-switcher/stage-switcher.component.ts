import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  input,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';

@Component({
  selector: 'pdz-stage-switcher',
  imports: [CommonModule,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  templateUrl: './stage-switcher.component.html',
  styleUrl: './stage-switcher.component.scss',
})
export class StageSwitcherComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  readonly currentStageSlug = input<string | null>(null);
  /**
   * When set, prepends a leading pill (slug `'all'`) with this label, for
   * callers that combine every stage's data into one view instead of
   * picking a single stage.
   */
  readonly allStagesLabel = input<string | null>(null);
  @Output() stageSelected = new EventEmitter<string>();

  stages: League.StageSummary[] = [];

  ngOnInit(): void {
    this.leagueService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stages) => {
          this.stages = stages;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectStage(stageSlug: string): void {
    if (stageSlug === this.currentStageSlug()) return;
    this.stageSelected.emit(stageSlug);
  }

  getStageLabel(stage: League.StageSummary): string {
    if (stage.name) return stage.name;
    return stage.type
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-stage-switcher',
  imports: [CommonModule],
  templateUrl: './stage-switcher.component.html',
  styleUrl: './stage-switcher.component.scss',
})
export class StageSwitcherComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  @Input() currentStageSlug: string | null = null;
  /**
   * When set, prepends a leading pill (slug `'all'`) with this label, for
   * callers that combine every stage's data into one view instead of
   * picking a single stage.
   */
  @Input() allStagesLabel: string | null = null;
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
    if (stageSlug === this.currentStageSlug) return;
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

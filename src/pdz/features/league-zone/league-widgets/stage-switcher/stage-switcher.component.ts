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

  @Input() currentStageId: string | null = null;
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

  selectStage(stageId: string): void {
    if (stageId === this.currentStageId) return;
    this.stageSelected.emit(stageId);
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

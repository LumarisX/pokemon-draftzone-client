import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { catchError, of } from 'rxjs';

export type StageSwitcherOption = { value: string; label: string };

@Component({
  selector: 'pdz-stage-switcher',
  imports: [SegmentedComponent, SegmentedOptionComponent],
  templateUrl: './stage-switcher.component.html',
  styleUrl: './stage-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageSwitcherComponent {
  private readonly leagueService = inject(LeagueZoneService);

  readonly currentStageSlug = input<string | null>(null);
  readonly allStagesLabel = input<string | null>(null);
  readonly leadingOptions = input<StageSwitcherOption[]>([]);
  readonly showStages = input(true);
  readonly stageSelected = output<string>();

  readonly stages = toSignal(
    this.leagueService
      .listStages()
      .pipe(catchError(() => of<League.StageSummary[]>([]))),
    { initialValue: [] },
  );

  selectStage(stageSlug: string): void {
    if (stageSlug === this.currentStageSlug()) return;
    this.stageSelected.emit(stageSlug);
  }

  stageLabel(stage: League.StageSummary): string {
    if (stage.name) return stage.name;
    const label = stage.type.split(/[-_\s]+/).filter(Boolean).join(' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}

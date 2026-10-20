import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
  DialogService,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { EntrantListComponent } from '../entrant-list/entrant-list.component';
import { ScheduleContext } from '../schedule-entrants';
import { stageHasResults } from '../schedule-edits';
import { generateStage } from '../schedule-generator';
import {
  ScheduleDraft,
  ScheduleEntrant,
  ScheduleStage,
  ScheduleTeam,
  STAGE_FORMATS,
  stageMatches,
} from '../schedule.model';

export interface StageEntrantsData {
  stage: ScheduleStage;
  draft: ScheduleDraft;
  context: ScheduleContext;
  teams: ScheduleTeam[];
}

export interface StageEntrantsResult {
  entrants: ScheduleEntrant[];
  random: boolean;
  rebuild: boolean;
}

@Component({
  selector: 'pdz-stage-entrants-dialog',
  imports: [
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    EntrantListComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stage-entrants">
      <pdz-entrant-list
        [(entrants)]="entrants"
        [(random)]="random"
        [canRandom]="!data.stage.drawn"
        [teams]="data.teams"
        [context]="data.context"
        [stageKey]="data.stage.key"
      />

      <aside class="stage-entrants__effect" aria-label="Effect on matches">
        <h3 class="stage-entrants__title">How This Changes {{ data.stage.name }}</h3>
        <p class="stage-entrants__hint">
          Matches point at seed numbers, so moving an entrant changes who plays
          in each match.
        </p>
        @if (maxSeed() > entrants().length && !rebuild()) {
          <p class="stage-entrants__warning">
            <pdz-icon name="warning" [size]="16" aria-hidden="true" />
            Matches use seeds up to {{ maxSeed() }}, but there are only
            {{ entrants().length }} entrants. Those matches can't be saved until
            every seed has an entrant.
          </p>
        }
        @if (canRebuild()) {
          <label
            pdz-check
            [label]="'Rebuild matches for ' + entrants().length + ' entrants'"
            [description]="
              'Replaces every match in this stage with a fresh ' +
              formatLabel() +
              '. Nothing has been played yet.'
            "
          >
            <input
              pdz-checkbox
              type="checkbox"
              [checked]="rebuild()"
              (change)="rebuild.set($any($event.target).checked)"
            />
          </label>
        } @else if (played()) {
          <p class="stage-entrants__hint">
            Results are recorded, so the matches stay as they are.
          </p>
        }
      </aside>
    </div>

    <div class="pdz-dialog-actions">
      <button pdz-button variant="ghost" color="neutral" (click)="ref.close()">
        Cancel
      </button>
      <button pdz-button (click)="apply()">Apply</button>
    </div>
  `,
  styleUrl: './stage-entrants-dialog.component.scss',
})
export class StageEntrantsDialogComponent {
  protected readonly data = inject(DIALOG_DATA) as StageEntrantsData;
  protected readonly ref = inject(DialogRef) as DialogRef<StageEntrantsResult>;

  protected readonly entrants = signal(this.data.stage.entrants);
  protected readonly random = signal(this.data.stage.random);
  protected readonly rebuild = signal(false);

  protected readonly formatLabel = computed(() =>
    STAGE_FORMATS[this.data.stage.type].label.toLowerCase(),
  );

  protected readonly played = computed(() =>
    stageHasResults(this.data.draft, this.data.stage.key),
  );

  protected readonly canRebuild = computed(
    () =>
      !this.played() &&
      generateStage(this.data.stage.type, Math.max(8, this.entrants().length))
        .length > 0,
  );

  protected readonly maxSeed = computed(() =>
    Math.max(
      0,
      ...stageMatches(this.data.draft, this.data.stage.key)
        .flatMap((match) => [match.a, match.b])
        .map((slot) => (slot.type === 'seed' ? slot.seed : 0)),
    ),
  );

  protected apply(): void {
    this.ref.close({
      entrants: this.entrants(),
      random: this.random(),
      rebuild: this.rebuild() && this.canRebuild(),
    });
  }
}

export function editStageEntrants(
  dialogs: DialogService,
  data: StageEntrantsData,
): Promise<StageEntrantsResult | undefined> {
  return dialogs.open<
    StageEntrantsDialogComponent,
    StageEntrantsResult,
    StageEntrantsData
  >(StageEntrantsDialogComponent, {
    heading: `Entrants · ${data.stage.name}`,
    size: 'lg',
    data,
  }).closed;
}

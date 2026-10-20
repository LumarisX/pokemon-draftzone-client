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
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ScheduleContext, placeLabel, stageName } from '../schedule-entrants';
import { ScheduleStage, ScheduleTeam } from '../schedule.model';

export interface ConfirmSeedsData {
  stage: ScheduleStage;
  context: ScheduleContext;
  teams: ScheduleTeam[];
}

export type ConfirmSeedsResult = { seed: number; teamId: string }[];

interface SeedRow {
  seed: number;
  label: string;
  suggested: string | null;
  tie: string | null;
}

@Component({
  selector: 'pdz-confirm-seeds-dialog',
  imports: [ButtonComponent, IconComponent, SelectComponent, SelectOptionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="confirm-seeds__hint">
      These come from the final standings. Check any place a tiebreaker
      decided, and change a team if the standings got it wrong.
    </p>
    <ol class="confirm-seeds__list">
      @for (row of rows; track row.seed) {
        <li class="confirm-seeds__row">
          <span class="confirm-seeds__seed">{{ row.seed }}</span>
          <span class="confirm-seeds__place">
            {{ row.label }}
            @if (row.tie) {
              <span class="confirm-seeds__tie">
                <pdz-icon name="warning" [size]="14" aria-hidden="true" />
                {{ row.tie }}
              </span>
            }
          </span>
          <pdz-select
            searchable
            class="confirm-seeds__team"
            [aria-label]="'Team for seed ' + row.seed"
            [value]="picks()[row.seed]"
            [showGroupInTrigger]="false"
            (valueChange)="pick(row.seed, $any($event))"
          >
            @for (team of data.teams; track team.teamId) {
              <pdz-option
                [value]="team.teamId"
                [label]="team.teamName"
                [description]="team.coachName"
              />
            }
          </pdz-select>
        </li>
      }
    </ol>
    @if (error(); as message) {
      <p class="confirm-seeds__error" role="alert">{{ message }}</p>
    }

    <div class="pdz-dialog-actions">
      <button pdz-button variant="ghost" color="neutral" (click)="ref.close()">
        Cancel
      </button>
      <button pdz-button (click)="submit()">Confirm Seeds</button>
    </div>
  `,
  styleUrl: './confirm-seeds-dialog.component.scss',
})
export class ConfirmSeedsDialogComponent {
  protected readonly data = inject(DIALOG_DATA) as ConfirmSeedsData;
  protected readonly ref = inject(DialogRef) as DialogRef<ConfirmSeedsResult>;

  protected readonly rows: SeedRow[] = this.buildRows();
  protected readonly picks = signal<Record<number, string | null>>(
    Object.fromEntries(this.rows.map((row) => [row.seed, row.suggested])),
  );
  protected readonly error = signal<string | null>(null);

  protected readonly duplicate = computed(() => {
    const chosen = Object.values(this.picks()).filter(Boolean);
    return new Set(chosen).size !== chosen.length;
  });

  private buildRows(): SeedRow[] {
    const { stage, context } = this.data;
    return stage.entrants
      .map((entrant, index) => ({ entrant, seed: index + 1 }))
      .filter(({ entrant }) => entrant.kind !== 'team' && !entrant.teamId)
      .map(({ entrant, seed }) => {
        if (entrant.kind !== 'place')
          return { seed, label: 'Open Slot', suggested: null, tie: null };
        const standings =
          context.projections.get(entrant.sourceStageKey ?? '')?.standings ?? [];
        const index = (entrant.place ?? 1) - 1;
        const row = standings[index];
        const level = (other?: (typeof standings)[number]) =>
          !!other &&
          !!row &&
          other.points === row.points &&
          other.gameDiff === row.gameDiff;
        const neighbour = [standings[index - 1], standings[index + 1]].find(level);
        return {
          seed,
          label: placeLabel(context, entrant),
          suggested: row?.teamId ?? null,
          tie: neighbour
            ? `Level with ${neighbour.teamName} on points and differential in ${stageName(context, entrant.sourceStageKey)}`
            : null,
        };
      });
  }

  protected pick(seed: number, teamId: string): void {
    this.picks.set({ ...this.picks(), [seed]: teamId });
    this.error.set(null);
  }

  protected submit(): void {
    const picks = this.picks();
    if (this.rows.some((row) => !picks[row.seed])) {
      this.error.set('Pick a team for every seed.');
      return;
    }
    if (this.duplicate()) {
      this.error.set('A team can only take one seed.');
      return;
    }
    this.ref.close(
      this.rows.map((row) => ({ seed: row.seed, teamId: picks[row.seed]! })),
    );
  }
}

export function confirmStageSeeds(
  dialogs: DialogService,
  data: ConfirmSeedsData,
): Promise<ConfirmSeedsResult | undefined> {
  return dialogs.open<
    ConfirmSeedsDialogComponent,
    ConfirmSeedsResult,
    ConfirmSeedsData
  >(ConfirmSeedsDialogComponent, {
    heading: `Confirm Seeds · ${data.stage.name}`,
    size: 'md',
    data,
  }).closed;
}

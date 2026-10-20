import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { editRoundSettings } from '../dialogs/round-settings-dialog.component';
import { ScheduleContext } from '../schedule-entrants';
import { addMatch } from '../schedule-edits';
import { formatDeadline, formatDeadlineLong, plural } from '../schedule-format';
import { ScheduleMatchGridComponent } from '../schedule-match/schedule-match-grid.component';
import {
  ScheduleDraft,
  ScheduleRound,
  STAGE_FORMATS,
  claimRound,
  insertRound,
  removeRound,
  roundIsEmpty,
  stageMatches,
  stageSpan,
} from '../schedule.model';

@Component({
  selector: 'pdz-schedule-round',
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    ScheduleMatchGridComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-round.component.html',
  styleUrl: './schedule-round.component.scss',
})
export class ScheduleRoundComponent {
  private readonly dialogs = inject(DialogService);

  readonly draft = input.required<ScheduleDraft>();
  readonly index = input.required<number>();
  readonly context = input.required<ScheduleContext>();
  readonly labels = input.required<Map<string, string>>();
  readonly editable = input(false);
  readonly currentRoundIndex = input(-1);
  readonly canSetCurrentRound = input(false);
  readonly matchupLinkBase = input<string[] | null>(null);

  readonly draftChange = output<ScheduleDraft>();
  readonly setCurrentRound = output<number>();
  readonly selectStage = output<string>();
  readonly addStage = output<number>();
  readonly focusMatch = output<string>();

  protected readonly round = computed<ScheduleRound | undefined>(
    () => this.draft().rounds[this.index()],
  );
  protected readonly live = computed(() => this.index() === this.currentRoundIndex());

  protected readonly groups = computed(() => {
    const draft = this.draft();
    const index = this.index();
    return draft.stages
      .filter((stage) => {
        const span = stageSpan(draft, stage);
        return index >= span.first && index <= span.last;
      })
      .map((stage) => ({
        stage,
        format: STAGE_FORMATS[stage.type].label,
        matches: stageMatches(draft, stage.key).filter((m) => m.round === index),
      }));
  });

  protected readonly meta = computed(() => {
    const round = this.round();
    const total = this.groups().reduce((sum, group) => sum + group.matches.length, 0);
    return [
      round?.matchDeadline
        ? `Matches due ${formatDeadlineLong(round.matchDeadline)}`
        : 'No match deadline',
      ...(round?.tradeDeadline
        ? [`Trades close ${formatDeadline(round.tradeDeadline)}`]
        : []),
      `${plural(total, 'match', 'matches')} across ${plural(this.groups().length, 'stage')}`,
    ];
  });

  protected readonly canDelete = computed(
    () => this.draft().rounds.length > 1 && roundIsEmpty(this.draft(), this.index()),
  );

  protected toggleLive(): void {
    this.setCurrentRound.emit(this.live() ? -1 : this.index());
  }

  protected async editSettings(): Promise<void> {
    const round = this.round();
    if (!round) return;
    const result = await editRoundSettings(this.dialogs, {
      name: round.name,
      matchDeadline: round.matchDeadline ?? null,
      tradeDeadline: round.tradeDeadline ?? null,
    });
    if (!result) return;
    const draft = this.draft();
    this.draftChange.emit({
      ...draft,
      rounds: draft.rounds.map((r, i) =>
        i === this.index() ? { ...claimRound(r), ...result } : r,
      ),
    });
  }

  protected addMatch(stageKey: string): void {
    this.draftChange.emit(addMatch(this.draft(), stageKey, this.index()));
  }

  protected insert(offset: 0 | 1): void {
    this.draftChange.emit(insertRound(this.draft(), this.index() + offset));
  }

  protected remove(): void {
    if (this.canDelete()) this.draftChange.emit(removeRound(this.draft(), this.index()));
  }
}

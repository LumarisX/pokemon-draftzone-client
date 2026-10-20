import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ScheduleContext } from './schedule-entrants';
import { ScheduleRoundComponent } from './schedule-round/schedule-round.component';
import { ScheduleSelection } from './schedule-selection';
import { ScheduleStageComponent } from './schedule-stage/schedule-stage.component';
import { ScheduleTimelineComponent } from './schedule-timeline/schedule-timeline.component';
import {
  ScheduleDraft,
  ScheduleTeam,
  StageProjection,
  insertRound,
  matchLabels,
  padRounds,
  stageSpan,
  trimAutoRounds,
} from './schedule.model';

@Component({
  selector: 'pdz-schedule',
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    ScheduleRoundComponent,
    ScheduleStageComponent,
    ScheduleTimelineComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
})
export class ScheduleComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly draft = model.required<ScheduleDraft>();
  readonly teams = input<ReadonlyMap<string, ScheduleTeam>>(new Map());
  readonly teamOptions = input<ScheduleTeam[]>([]);
  readonly projections = input<ReadonlyMap<string, StageProjection>>(new Map());
  readonly editable = input(false);
  readonly currentRoundIndex = input(-1);
  readonly canSetCurrentRound = input(false);
  readonly matchupLinkBase = input<string[] | null>(null);
  readonly confirmingStage = input<string | null>(null);

  readonly addStage = output<number | null>();
  readonly setCurrentRound = output<number>();
  readonly confirmSeeds = output<string>();

  private readonly picked = signal<ScheduleSelection | null>(null);

  protected readonly context = computed<ScheduleContext>(() => ({
    teams: this.teams(),
    projections: this.projections(),
    stages: this.draft().stages,
  }));

  protected readonly labels = computed(() => matchLabels(this.draft()));

  protected readonly selection = computed<ScheduleSelection | null>(() => {
    const draft = this.draft();
    const picked = this.picked();
    if (picked?.kind === 'stage' && draft.stages.some((s) => s.key === picked.key))
      return picked;
    if (picked?.kind === 'round' && picked.index < draft.rounds.length) return picked;

    const live = this.currentRoundIndex();
    if (live >= 0 && live < draft.rounds.length)
      return { kind: 'round', index: live };
    const first = draft.stages[0];
    if (first) return { kind: 'stage', key: first.key };
    return null;
  });

  protected readonly selectedStage = computed(() => {
    const selection = this.selection();
    if (selection?.kind !== 'stage') return null;
    return this.draft().stages.find((s) => s.key === selection.key) ?? null;
  });

  protected readonly selectedRound = computed(() => {
    const selection = this.selection();
    return selection?.kind === 'round' ? selection.index : null;
  });

  selectStage(key: string): void {
    this.picked.set({ kind: 'stage', key });
    this.scrollDetailToTop();
  }

  protected selectRound(index: number): void {
    this.picked.set({ kind: 'round', index });
    this.scrollDetailToTop();
  }

  protected commit(draft: ScheduleDraft): void {
    this.draft.set(trimAutoRounds(padRounds(draft)));
  }

  protected addRound(): void {
    const draft = this.draft();
    const next = insertRound(draft, draft.rounds.length);
    this.draft.set(next);
    this.picked.set({ kind: 'round', index: next.rounds.length - 1 });
  }

  protected focusMatch(matchId: string): void {
    const match = this.draft().matches.find((m) => m.id === matchId);
    if (!match) return;
    const stage = this.draft().stages.find((s) => s.key === match.section);
    const selection = this.selection();
    if (
      stage &&
      !(selection?.kind === 'stage' && selection.key === stage.key) &&
      !(selection?.kind === 'round' && selection.index === match.round)
    ) {
      const span = stageSpan(this.draft(), stage);
      if (match.round >= span.first) this.picked.set({ kind: 'stage', key: stage.key });
    }
    requestAnimationFrame(() => {
      const node = (this.host.nativeElement as HTMLElement).querySelector(
        `[data-match-id="${CSS.escape(matchId)}"]`,
      );
      node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  private scrollDetailToTop(): void {
    const detail = (this.host.nativeElement as HTMLElement).querySelector(
      '.schedule__detail',
    );
    if (detail) detail.scrollTop = 0;
  }
}

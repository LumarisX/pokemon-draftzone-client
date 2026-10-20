import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { formatDeadline } from '../schedule-format';
import {
  ScheduleDraft,
  stageLanes,
  stageMatches,
  stageSpan,
} from '../schedule.model';
import { ScheduleSelection } from '../schedule-selection';

interface Bar {
  key: string;
  name: string;
  lane: number;
  first: number;
  last: number;
  hidden: boolean;
  played: number;
  total: number;
}

@Component({
  selector: 'pdz-schedule-timeline',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-timeline.component.html',
  styleUrl: './schedule-timeline.component.scss',
})
export class ScheduleTimelineComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => {
      const root = this.host.nativeElement as HTMLElement;
      const scroller = root.querySelector<HTMLElement>('.timeline__scroll');
      const target = root.querySelector<HTMLElement>(
        '.timeline__col--selected, .timeline__col--live',
      );
      const rail = root.querySelector<HTMLElement>('.timeline__rail');
      if (!scroller || !target) return;
      const offset = target.offsetLeft - (rail?.offsetWidth ?? 0);
      if (offset + target.offsetWidth > scroller.clientWidth)
        scroller.scrollLeft = Math.max(0, offset - target.offsetWidth);
    });
  }

  readonly draft = input.required<ScheduleDraft>();
  readonly selection = input<ScheduleSelection | null>(null);
  readonly currentRoundIndex = input(-1);
  readonly editable = input(false);

  readonly selectStage = output<string>();
  readonly selectRound = output<number>();
  readonly addStage = output<void>();
  readonly addRound = output<void>();

  protected readonly lanes = computed(() => stageLanes(this.draft()));

  protected readonly weeks = computed(() =>
    this.draft().rounds.map((round, index) => ({
      key: round.key,
      index,
      name: round.name,
      due: round.matchDeadline
        ? `Due ${formatDeadline(round.matchDeadline)}`
        : 'No deadline',
    })),
  );

  protected readonly bars = computed<Bar[]>(() => {
    const draft = this.draft();
    const { lanes } = this.lanes();
    return draft.stages.map((stage) => {
      const span = stageSpan(draft, stage);
      const matches = stageMatches(draft, stage.key);
      return {
        key: stage.key,
        name: stage.name,
        lane: lanes.get(stage.key) ?? 0,
        first: span.first,
        last: span.last,
        hidden: !stage.public,
        played: matches.filter((m) => m.winner !== undefined || !!m.advances)
          .length,
        total: matches.length,
      };
    });
  });

  protected isStage(key: string): boolean {
    const selection = this.selection();
    return selection?.kind === 'stage' && selection.key === key;
  }

  protected isRound(index: number): boolean {
    const selection = this.selection();
    return selection?.kind === 'round' && selection.index === index;
  }
}

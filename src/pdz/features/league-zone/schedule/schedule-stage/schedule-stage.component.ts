import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FlexBracketMatch } from '@pdz/features/league-zone/schedule/bracket.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { editStageEntrants } from '../dialogs/stage-entrants-dialog.component';
import { editStageSettings } from '../dialogs/stage-settings-dialog.component';
import {
  ScheduleContext,
  pendingSeeds,
  resolveEntrant,
  sourceStagesOf,
  sourcesComplete,
} from '../schedule-entrants';
import {
  addMatch,
  removeStage,
  replaceStageMatches,
  stageHasResults,
  updateStage,
} from '../schedule-edits';
import { formatDeadline, plural } from '../schedule-format';
import { generateStage, placeStage } from '../schedule-generator';
import { ScheduleMatchGridComponent } from '../schedule-match/schedule-match-grid.component';
import { ScheduleMatchComponent } from '../schedule-match/schedule-match.component';
import {
  BRACKET_GROUP_TITLES,
  BracketGroup,
  ScheduleDraft,
  ScheduleStage,
  ScheduleTeam,
  STAGE_FORMATS,
  bracketGroups,
  isElimination,
  shiftStage,
  stageMatches,
  stageSpan,
} from '../schedule.model';

type Layout = 'bracket' | 'rounds';

interface RoundSection {
  index: number;
  name: string;
  due: string;
  live: boolean;
  matches: FlexBracketMatch[];
}

interface BracketSection {
  title: string | null;
  columns: { index: number; name: string; live: boolean; matches: FlexBracketMatch[] }[];
}

const COLLAPSED_ENTRANTS = 8;

@Component({
  selector: 'pdz-schedule-stage',
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    ScheduleMatchComponent,
    ScheduleMatchGridComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-stage.component.html',
  styleUrl: './schedule-stage.component.scss',
})
export class ScheduleStageComponent {
  private readonly dialogs = inject(DialogService);

  readonly draft = input.required<ScheduleDraft>();
  readonly stage = input.required<ScheduleStage>();
  readonly context = input.required<ScheduleContext>();
  readonly labels = input.required<Map<string, string>>();
  readonly teamOptions = input<ScheduleTeam[]>([]);
  readonly editable = input(false);
  readonly currentRoundIndex = input(-1);
  readonly matchupLinkBase = input<string[] | null>(null);
  readonly confirming = input(false);

  readonly draftChange = output<ScheduleDraft>();
  readonly confirmSeeds = output<string>();
  readonly focusMatch = output<string>();

  private readonly layoutByStage = signal(new Map<string, Layout>());
  protected readonly showAllEntrants = signal(false);

  protected readonly format = computed(() => STAGE_FORMATS[this.stage().type]);
  protected readonly elimination = computed(() => isElimination(this.stage().type));

  protected readonly layout = computed<Layout>(() =>
    this.elimination()
      ? (this.layoutByStage().get(this.stage().key) ?? 'bracket')
      : 'rounds',
  );

  protected readonly matches = computed(() =>
    stageMatches(this.draft(), this.stage().key),
  );

  protected readonly played = computed(
    () => this.matches().filter((m) => m.winner !== undefined || !!m.advances).length,
  );

  protected readonly span = computed(() => stageSpan(this.draft(), this.stage()));

  protected readonly hasResults = computed(() =>
    stageHasResults(this.draft(), this.stage().key),
  );

  protected readonly weeksText = computed(() => {
    const { first, last } = this.span();
    const rounds = this.draft().rounds;
    const start = rounds[first]?.name ?? `Week ${first + 1}`;
    if (first === last) return start;
    return `${start} – ${rounds[last]?.name ?? `Week ${last + 1}`}`;
  });

  protected readonly meta = computed(() => {
    const count = this.matches().length;
    return [
      this.weeksText(),
      plural(this.stage().entrants.length, 'entrant'),
      count ? `${plural(count, 'match', 'matches')} · ${this.played()} played` : 'No matches',
    ];
  });

  protected readonly entrants = computed(() =>
    this.stage().entrants.map((_, index) => ({
      seed: index + 1,
      ...resolveEntrant(this.context(), this.stage(), index + 1),
    })),
  );

  protected readonly shownEntrants = computed(() =>
    this.showAllEntrants()
      ? this.entrants()
      : this.entrants().slice(0, COLLAPSED_ENTRANTS),
  );

  protected readonly hiddenEntrantCount = computed(() =>
    Math.max(0, this.entrants().length - COLLAPSED_ENTRANTS),
  );

  protected readonly pending = computed(() => pendingSeeds(this.stage()).length);

  protected readonly sources = computed(() =>
    sourceStagesOf(this.context(), this.stage()).map((s) => s.name),
  );

  protected readonly sourcesDone = computed(() =>
    sourcesComplete(this.context(), this.draft(), this.stage()),
  );

  protected readonly canConfirm = computed(
    () => this.pending() > 0 && !!this.stage().stageId,
  );

  protected readonly rounds = computed<RoundSection[]>(() => {
    const { first, last } = this.span();
    const draft = this.draft();
    const sections: RoundSection[] = [];
    for (let index = first; index <= last; index++) {
      const round = draft.rounds[index];
      sections.push({
        index,
        name: round?.name ?? `Week ${index + 1}`,
        due: round?.matchDeadline
          ? `Matches due ${formatDeadline(round.matchDeadline)}`
          : 'No deadline',
        live: index === this.currentRoundIndex(),
        matches: this.matches().filter((match) => match.round === index),
      });
    }
    return sections;
  });

  protected readonly bracket = computed<BracketSection[]>(() => {
    const matches = this.matches();
    const lives = this.format().lives;
    const groups = bracketGroups(matches);
    const order: (BracketGroup | null)[] =
      lives > 1 ? ['upper', 'lower', 'last', 'final'] : [null];
    const rounds = this.draft().rounds;
    return order
      .map((group) => {
        const inGroup = group
          ? matches.filter((match) => groups.get(match.id) === group)
          : matches;
        const indexes = [...new Set(inGroup.map((match) => match.round))].sort(
          (a, b) => a - b,
        );
        return {
          title: group ? BRACKET_GROUP_TITLES[group] : null,
          columns: indexes.map((index) => ({
            index,
            name: rounds[index]?.name ?? `Week ${index + 1}`,
            live: index === this.currentRoundIndex(),
            matches: inGroup.filter((match) => match.round === index),
          })),
        };
      })
      .filter((section) => section.columns.length > 0);
  });

  protected setLayout(layout: Layout): void {
    const next = new Map(this.layoutByStage());
    next.set(this.stage().key, layout);
    this.layoutByStage.set(next);
  }

  protected emit(draft: ScheduleDraft): void {
    this.draftChange.emit(draft);
  }

  protected toggleVisible(): void {
    const stage = this.stage();
    this.emit(updateStage(this.draft(), stage.key, { public: !stage.public }));
  }

  protected addFirstMatch(): void {
    this.addMatchTo(this.span().first);
  }

  protected addMatchTo(round: number): void {
    this.emit(addMatch(this.draft(), this.stage().key, round));
  }

  protected async editSettings(): Promise<void> {
    const stage = this.stage();
    const draft = this.draft();
    const result = await editStageSettings(this.dialogs, {
      name: stage.name,
      start: this.span().first,
      public: stage.public,
      weeks: [
        ...draft.rounds.map((round, index) => ({ index, label: round.name })),
        { index: draft.rounds.length, label: `Week ${draft.rounds.length + 1} (new)` },
      ],
    });
    if (!result) return;
    const renamed = updateStage(draft, stage.key, {
      name: result.name,
      public: result.public,
    });
    this.emit(shiftStage(renamed, stage.key, result.start));
  }

  protected async editEntrants(): Promise<void> {
    const stage = this.stage();
    const draft = this.draft();
    const result = await editStageEntrants(this.dialogs, {
      stage,
      draft,
      context: this.context(),
      teams: this.teamOptions(),
    });
    if (!result) return;
    let next = updateStage(draft, stage.key, {
      entrants: result.entrants,
      random: result.random,
      entrantsChanged: true,
    });
    if (result.rebuild) {
      const templates = generateStage(stage.type, result.entrants.length, {
        thirdPlace: draft.matches.some(
          (m) => m.section === stage.key && m.label === 'Third Place',
        ),
        grandFinalReset: draft.matches.some(
          (m) => m.section === stage.key && m.label === 'Grand Final Reset',
        ),
      });
      next = replaceStageMatches(
        next,
        stage.key,
        placeStage(templates, stage.key, this.span().first),
      );
    }
    this.emit(next);
  }

  protected async deleteStage(): Promise<void> {
    const stage = this.stage();
    if (this.hasResults()) return;
    const confirmed = await this.dialogs.confirm(`Delete ${stage.name}?`, {
      message: `This removes the stage and its ${plural(this.matches().length, 'match', 'matches')} when you save.`,
      confirmLabel: 'Delete Stage',
      confirmColor: 'danger',
    });
    if (confirmed) this.emit(removeStage(this.draft(), stage.key));
  }
}

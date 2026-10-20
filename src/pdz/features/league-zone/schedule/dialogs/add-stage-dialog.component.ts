import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FlexBracketMatch } from '@pdz/features/league-zone/schedule/bracket.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
  DialogService,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { formatDeadline } from '../schedule-format';
import { EntrantListComponent } from '../entrant-list/entrant-list.component';
import {
  generateStage,
  minimumEntrants,
  placeStage,
  StageTemplate,
  stageWeeks,
} from '../schedule-generator';
import { ScheduleContext, stageName } from '../schedule-entrants';
import {
  ScheduleDraft,
  ScheduleEntrant,
  ScheduleStage,
  ScheduleStageType,
  ScheduleTeam,
  STAGE_FORMATS,
  ordinal,
} from '../schedule.model';

type FormatChoice = 'round-robin' | 'elimination' | 'custom';

const LIVES_TYPES: ScheduleStageType[] = [
  'single-elimination',
  'double-elimination',
  'triple-elimination',
];

const LIVES_BLURB = [
  'Lose once and you are out. One bracket.',
  'Your first loss drops you to the lower bracket. Two losses and you are out.',
  'Upper, lower and last-chance brackets. Three losses and you are out. Plan for about three times as many matches as entrants.',
];

export interface AddStageData {
  key: string;
  draft: ScheduleDraft;
  context: ScheduleContext;
  teams: ScheduleTeam[];
  start: number;
}

export interface AddStageResult {
  stage: ScheduleStage;
  matches: FlexBracketMatch[];
}

interface PreviewWeek {
  label: string;
  matches: { label: string; tag: string | null; a: string; b: string }[];
}

@Component({
  selector: 'pdz-add-stage-dialog',
  imports: [
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    EntrantListComponent,
    FieldComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-stage-dialog.component.html',
  styleUrl: './add-stage-dialog.component.scss',
})
export class AddStageDialogComponent {
  protected readonly data = inject(DIALOG_DATA) as AddStageData;
  private readonly ref = inject(DialogRef) as DialogRef<AddStageResult>;

  protected readonly livesBlurb = LIVES_BLURB;

  protected readonly name = signal(
    this.data.draft.stages.length ? 'Playoffs' : 'Regular Season',
  );
  protected readonly format = signal<FormatChoice>(
    this.data.draft.stages.length ? 'elimination' : 'round-robin',
  );
  protected readonly lives = signal(1);
  protected readonly playTwice = signal(false);
  protected readonly thirdPlace = signal(false);
  protected readonly reset = signal(true);
  protected readonly entrants = signal<ScheduleEntrant[]>([]);
  protected readonly random = signal(false);
  protected readonly start = signal(this.data.start);
  protected readonly visible = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly type = computed<ScheduleStageType>(() => {
    const format = this.format();
    if (format === 'elimination') return LIVES_TYPES[this.lives() - 1];
    return format;
  });

  protected readonly formatLabel = computed(
    () => STAGE_FORMATS[this.type()].label,
  );

  protected readonly minimum = computed(() => minimumEntrants(this.type()));

  protected readonly templates = computed(() =>
    generateStage(this.type(), this.entrants().length, {
      playTwice: this.playTwice(),
      thirdPlace: this.thirdPlace(),
      grandFinalReset: this.reset(),
    }),
  );

  protected readonly weeks = computed(() => stageWeeks(this.templates()));

  protected readonly weekOptions = computed(() => {
    const rounds = this.data.draft.rounds;
    return [
      ...rounds.map((round, index) => ({
        index,
        label: round.matchDeadline
          ? `${round.name} · ${formatDeadline(round.matchDeadline)}`
          : round.name,
      })),
      { index: rounds.length, label: `Week ${rounds.length + 1} (new)` },
    ];
  });

  protected readonly runsHint = computed(() => {
    const weeks = this.weeks();
    if (!weeks) return 'Takes one week until you add matches.';
    const end = this.start() + weeks - 1;
    const added = Math.max(0, end - (this.data.draft.rounds.length - 1));
    return (
      `Runs ${weeks} ${weeks === 1 ? 'week' : 'weeks'}, through Week ${end + 1}.` +
      (added ? ` Adds ${added} new ${added === 1 ? 'week' : 'weeks'} to the season.` : '')
    );
  });

  protected readonly summary = computed(() => {
    const count = this.templates().length;
    const weeks = Math.max(1, this.weeks());
    return `${count} ${count === 1 ? 'match' : 'matches'} over ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  });

  protected readonly preview = computed<PreviewWeek[]>(() => {
    const templates = this.templates();
    const sorted = templates.slice().sort((a, b) => a.depth! - b.depth!);
    const labels = new Map<string, string>();
    let n = 1;
    for (const t of sorted) labels.set(t.key, t.label ?? `M${n++}`);
    const groups = this.previewTags(templates);

    const weeks: PreviewWeek[] = [];
    for (let depth = 1; depth <= this.weeks(); depth++) {
      const index = this.start() + depth - 1;
      weeks.push({
        label: this.data.draft.rounds[index]?.name ?? `Week ${index + 1}`,
        matches: sorted
          .filter((t) => t.depth === depth)
          .map((t) => ({
            label: labels.get(t.key)!,
            tag: groups.get(t.key) ?? null,
            a: this.slotText(t.a, labels),
            b: this.slotText(t.b, labels),
          })),
      });
    }
    return weeks;
  });

  private previewTags(templates: StageTemplate[]): Map<string, string> {
    const tags = new Map<string, string>();
    if (this.format() !== 'elimination' || this.lives() === 1) return tags;
    for (const t of templates) {
      if (t.label) continue;
      tags.set(
        t.key,
        t.key.startsWith('x1') ? 'Lower' : t.key.startsWith('x2') ? 'Last' : 'Upper',
      );
    }
    return tags;
  }

  private slotText(slot: StageTemplate['a'], labels: Map<string, string>): string {
    if (slot.t === 'seed') return this.seedText(slot.seed);
    if (slot.t === 'winner') return `W ${labels.get(slot.from)}`;
    if (slot.t === 'loser') return `L ${labels.get(slot.from)}`;
    return 'TBD';
  }

  private seedText(seed: number): string {
    const entrant = this.entrants()[seed - 1];
    if (!entrant || (this.random() && entrant.kind === 'team')) return `Seed ${seed}`;
    if (entrant.kind === 'team')
      return this.data.context.teams.get(entrant.teamId ?? '')?.teamName ??
        this.data.teams.find((t) => t.teamId === entrant.teamId)?.teamName ??
        `Seed ${seed}`;
    if (entrant.kind === 'place')
      return `${stageName(this.data.context, entrant.sourceStageKey)} ${ordinal(entrant.place ?? 1)}`;
    return `Open ${seed}`;
  }

  protected setFormat(format: FormatChoice): void {
    this.format.set(format);
    this.error.set(null);
  }

  protected create(): void {
    const name = this.name().trim();
    if (!name) {
      this.error.set('Give the stage a name.');
      return;
    }
    const count = this.entrants().length;
    if (count < this.minimum()) {
      this.error.set(
        `${this.formatLabel()} needs at least ${this.minimum()} entrants.`,
      );
      return;
    }
    const stage: ScheduleStage = {
      key: this.data.key,
      name,
      type: this.type(),
      public: this.visible(),
      entrants: this.entrants(),
      random: this.random(),
      drawn: false,
      storesEntrants: false,
      entrantsChanged: true,
      startRound: this.start(),
    };
    this.ref.close({
      stage,
      matches: placeStage(this.templates(), stage.key, this.start()),
    });
  }

  protected close(): void {
    this.ref.close();
  }
}

export function openAddStage(
  dialogs: DialogService,
  data: AddStageData,
): Promise<AddStageResult | undefined> {
  return dialogs.open<AddStageDialogComponent, AddStageResult, AddStageData>(
    AddStageDialogComponent,
    { heading: 'Add Stage', size: 'lg', data },
  ).closed;
}

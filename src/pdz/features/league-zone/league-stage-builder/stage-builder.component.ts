import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  BracketTeamFlex,
  FlexBracketMatch,
} from '../league-bracket/bracket.model';
import {
  addMatchToRound,
  deleteMatch,
  moveMatch,
} from '../league-bracket/bracket-generator';
import { MatchCardComponent } from './match-card/match-card.component';
import {
  BuilderDraft,
  BuilderRound,
  StageSpan,
  cellMatches,
  claimRound,
  insertRound,
  moveStage,
  padRounds,
  removeRound,
  reorderRounds,
  roundIsEmpty,
  stageKeyOf,
  stageSpans,
  trimAutoRounds,
} from './stage-builder.model';

function assignColumns(spans: StageSpan[]): Map<string, number> {
  const columns = new Map<string, number>();
  const columnEnds: number[] = [];

  for (const span of [...spans].sort((a, b) => a.firstRound - b.firstRound)) {
    let column = columnEnds.findIndex((end) => span.firstRound > end);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(span.lastRound);
    } else {
      columnEnds[column] = span.lastRound;
    }
    columns.set(span.key, column);
  }
  return columns;
}

interface BuilderCell {
  id: string;
  stageKey: string;
  round: number;
  inSpan: boolean;
  matches: FlexBracketMatch[];
}

interface StageBox {
  key: string;
  title: string;
  typeLabel: string;
  typeIcon: string;
  matchCount: number;
  public: boolean;
  span: StageSpan;
  rowStart: number;
  rowEnd: number;
  column: number;
  cells: BuilderCell[];
}

const FOCUS_FLASH_MS = 1300;
const FOCUS_SETTLE_FRAMES = 3;
const FOCUS_SETTLE_TIMEOUT_MS = 2000;

const STAGE_TYPES: Record<string, { label: string; icon: string }> = {
  'round-robin': { label: 'Round Robin', icon: 'grid_view' },
  'single-elimination': { label: 'Single Elim', icon: 'account_tree' },
  'double-elimination': { label: 'Double Elim', icon: 'account_tree' },
  swiss: { label: 'Swiss', icon: 'swap_horiz' },
  custom: { label: 'Custom', icon: 'dashboard' },
};

@Component({
  selector: 'pdz-stage-builder',
  imports: [
    CommonModule,
    FormsModule,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDropListGroup,
    CdkScrollable,
    IconComponent,
    MatchCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stage-builder.component.html',
  styleUrl: './stage-builder.component.scss',
})
export class StageBuilderComponent implements OnChanges, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly draft = input.required<BuilderDraft>();
  readonly teamsByStage = input(new Map<string, BracketTeamFlex[]>());
  readonly editable = input(false);
  readonly matchupLinkBase = input<string[] | null>();
  readonly currentRoundIndex = input(-1);

  @Output() draftChange = new EventEmitter<BuilderDraft>();
  @Output() editMatch = new EventEmitter<string>();
  @Output() addStage = new EventEmitter<number>();

  @ViewChild('grid') private gridRef?: ElementRef<HTMLElement>;

  protected stages: StageBox[] = [];
  protected columnCount = 1;

  private emptyStageRounds = new Map<string, number>();
  private focusTimer?: ReturnType<typeof setTimeout>;
  private focusFrame?: number;
  private focusedNode?: HTMLElement;

  ngOnChanges(): void {
    this.rebuild();
  }

  ngOnDestroy(): void {
    this.cancelFocus();
  }

  protected onFocusMatch(matchId: string): void {
    const grid = this.gridRef?.nativeElement;
    if (!grid) return;

    const node = Array.from(
      grid.querySelectorAll<HTMLElement>('[data-match-id]'),
    ).find((el) => el.dataset['matchId'] === matchId);
    if (!node) return;

    const still = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    node.scrollIntoView({
      behavior: still ? 'auto' : 'smooth',
      block: 'center',
      inline: 'center',
    });

    this.zone.runOutsideAngular(() => {
      this.cancelFocus();
      this.afterScrollSettles(node, () => this.flash(node));
    });
  }

  private afterScrollSettles(node: HTMLElement, done: () => void): void {
    const deadline = performance.now() + FOCUS_SETTLE_TIMEOUT_MS;
    let previous = '';
    let stableFrames = 0;

    const step = () => {
      const rect = node.getBoundingClientRect();
      const position = `${Math.round(rect.top)}:${Math.round(rect.left)}`;
      stableFrames = position === previous ? stableFrames + 1 : 0;
      previous = position;

      if (stableFrames >= FOCUS_SETTLE_FRAMES || performance.now() > deadline) {
        this.focusFrame = undefined;
        done();
        return;
      }
      this.focusFrame = requestAnimationFrame(step);
    };
    this.focusFrame = requestAnimationFrame(step);
  }

  private flash(node: HTMLElement): void {
    void node.offsetWidth;
    node.classList.add('cell__item--focused');
    this.focusedNode = node;
    this.focusTimer = setTimeout(() => {
      node.classList.remove('cell__item--focused');
      this.focusedNode = undefined;
    }, FOCUS_FLASH_MS);
  }

  private cancelFocus(): void {
    clearTimeout(this.focusTimer);
    if (this.focusFrame !== undefined) cancelAnimationFrame(this.focusFrame);
    this.focusFrame = undefined;
    this.focusedNode?.classList.remove('cell__item--focused');
    this.focusedNode = undefined;
  }

  get rounds(): BuilderRound[] {
    return this.draft()?.rounds ?? [];
  }

  protected trackRound = (_: number, round: BuilderRound) => round.key;
  protected trackStage = (_: number, stage: StageBox) => stage.key;
  protected trackCell = (_: number, cell: BuilderCell) => cell.id;
  protected trackMatch = (_: number, match: FlexBracketMatch) => match.id;

  protected cellIds: string[] = [];

  protected labels = new Map<string, string>();

  protected teamsFor(stageKey: string): BracketTeamFlex[] {
    return this.teamsByStage().get(stageKey) ?? [];
  }

  private rebuild(): void {
    const draft = this.draft();
    if (!draft) return;

    const spans = stageSpans(draft, this.emptyStageRounds);
    const stageOf = (key: string) =>
      this.draft().stages.find((s) => s.key === key);
    const columnOf = assignColumns(spans);
    this.columnCount = Math.max(1, new Set(columnOf.values()).size);
    const reachable = this.reachableRounds(spans, columnOf);

    this.stages = spans.map((span) => {
      const rounds = [
        ...Array.from(
          { length: span.lastRound - span.firstRound + 1 },
          (_, offset) => span.firstRound + offset,
        ),
        ...(reachable.get(span.key) ?? []),
      ].sort((a, b) => a - b);

      const stage = stageOf(span.key);
      const type = stage ? STAGE_TYPES[stage.type] : undefined;
      return {
        key: span.key,
        title: stage?.name ?? span.key,
        typeLabel: type?.label ?? '',
        typeIcon: type?.icon ?? 'dashboard',
        matchCount: this.draft().matches.filter(
          (match) => stageKeyOf(match) === span.key,
        ).length,
        public: stage?.public !== false,
        span,
        rowStart: span.firstRound + 1,
        rowEnd: span.lastRound + 2,
        column: 2 + (columnOf.get(span.key) ?? 0),
        cells: rounds.map((round) => ({
          id: `cell_${span.key}_${round}`,
          stageKey: span.key,
          round,
          inSpan: round >= span.firstRound && round <= span.lastRound,
          matches: cellMatches(this.draft().matches, span.key, round),
        })),
      };
    });

    this.labels = this.buildLabels();
    this.cellIds = this.stages.flatMap((s) => s.cells.map((c) => c.id));
  }

  private reachableRounds(
    spans: StageSpan[],
    columnOf: Map<string, number>,
  ): Map<string, number[]> {
    const reachable = new Map<string, number[]>(spans.map((s) => [s.key, []]));

    const byColumn = new Map<number, StageSpan[]>();
    for (const span of spans) {
      const column = columnOf.get(span.key) ?? 0;
      byColumn.set(column, [...(byColumn.get(column) ?? []), span]);
    }

    const distance = (span: StageSpan, round: number) =>
      round < span.firstRound
        ? span.firstRound - round
        : round - span.lastRound;

    for (const column of byColumn.values()) {
      const stacked = [...column].sort((a, b) => a.firstRound - b.firstRound);

      for (let round = 0; round < this.rounds.length; round++) {
        const taken = stacked.some(
          (s) => round >= s.firstRound && round <= s.lastRound,
        );
        if (taken) continue;
        const owner = stacked.reduce((best, s) =>
          distance(s, round) < distance(best, round) ? s : best,
        );
        reachable.get(owner.key)!.push(round);
      }
    }
    return reachable;
  }

  private buildLabels(): Map<string, string> {
    const labels = new Map<string, string>();
    for (const stage of this.stages) {
      let n = 1;
      for (const cell of stage.cells) {
        for (const match of cell.matches) {
          labels.set(match.id, match.label ?? `Match ${n++}`);
        }
      }
    }
    return labels;
  }

  private commit(draft: BuilderDraft): void {
    this.draft = trimAutoRounds(padRounds(draft));
    this.rebuild();
    this.draftChange.emit(this.draft());
  }

  protected onDrop(event: CdkDragDrop<BuilderCell>): void {
    const matchId = event.item.data as string;
    const target = event.container.data;
    this.commit({
      ...this.draft(),
      matches: moveMatch(
        this.draft().matches,
        matchId,
        target.stageKey,
        target.round,
        event.currentIndex,
      ),
    });
  }

  protected onAddMatch(cell: BuilderCell): void {
    this.commit({
      ...this.draft(),
      matches: addMatchToRound(this.draft().matches, cell.stageKey, cell.round),
    });
  }

  protected onRemoveMatch(matchId: string): void {
    this.commit({
      ...this.draft(),
      matches: deleteMatch(this.draft().matches, matchId),
    });
  }

  protected onInsertRound(index: number): void {
    this.commit(
      insertRound(this.draft(), index, {
        name: `Round ${this.rounds.length + 1}`,
      }),
    );
  }

  protected onRemoveRound(index: number): void {
    if (!this.canRemoveRound(index)) return;
    this.commit(removeRound(this.draft(), index));
  }

  protected canRemoveRound(index: number): boolean {
    return this.rounds.length > 1 && roundIsEmpty(this.draft(), index);
  }

  protected onMoveRound(index: number, delta: -1 | 1): void {
    this.commit(reorderRounds(this.draft(), index, index + delta));
  }

  protected onRenameRound(index: number, name: string): void {
    const rounds = this.rounds.map((round, i) =>
      i === index ? { ...claimRound(round), name } : round,
    );
    this.commit({ ...this.draft(), rounds });
  }

  protected onRoundDeadline(index: number, value: string): void {
    const rounds = this.rounds.map((round, i) =>
      i === index
        ? {
            ...claimRound(round),
            matchDeadline: value ? new Date(value).toISOString() : null,
          }
        : round,
    );
    this.commit({ ...this.draft(), rounds });
  }

  protected deadlineValue(round: BuilderRound): string {
    if (!round.matchDeadline) return '';
    const date = new Date(round.matchDeadline);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
  }

  protected onMoveStage(stageKey: string, delta: -1 | 1): void {
    const span = this.stages.find((s) => s.key === stageKey)?.span;
    if (!span) return;

    const draft = this.draft();
    if (!draft.matches.some((m) => stageKeyOf(m) === stageKey)) {
      const round = Math.max(0, span.firstRound + delta);
      this.emptyStageRounds.set(stageKey, round);
      this.commit(padRounds({ ...draft }));
      return;
    }

    this.commit(moveStage(draft, stageKey, delta));
  }

  protected canMoveStage(stage: StageBox, delta: -1 | 1): boolean {
    return delta === 1 || stage.span.firstRound > 0;
  }

  protected onToggleStageVisibility(stageKey: string): void {
    this.commit({
      ...this.draft(),
      stages: this.draft().stages.map((stage) =>
        stage.key === stageKey
          ? { ...stage, public: stage.public === false }
          : stage,
      ),
    });
  }
}

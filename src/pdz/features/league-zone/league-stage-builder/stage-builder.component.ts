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
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  inject,
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
import { StageWiresComponent } from './stage-wires/stage-wires.component';
import {
  Wire,
  WireGeometry,
  WireRect,
  computeWires,
  requiredCorridorHeight,
  planRoutes,
} from './wire-routing';

/**
 * Packs stages into as few columns as the schedule allows.
 *
 * Two stages only need separate columns when their rounds overlap — a
 * playoff bracket that runs after every group is finished can sit back at the
 * left rather than pushing the grid ever wider. This is the same greedy
 * interval colouring the wire router uses for its band lanes.
 */
function assignColumns(spans: StageSpan[]): Map<string, number> {
  const columns = new Map<string, number>();
  /** Last round occupied by each column so far. */
  const columnEnds: number[] = [];

  // Earliest-starting stage first, so a column is only reused by a stage
  // that genuinely begins after the previous one ended.
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

/** One droppable (stage, round) slot on the grid. */
interface BuilderCell {
  id: string;
  stageKey: string;
  round: number;
  /**
   * False for a round the stage does not reach yet. Such a cell holds nothing
   * and draws nothing until a card is picked up — it exists so a match has
   * somewhere to land outside its stage's current rows.
   */
  inSpan: boolean;
  matches: FlexBracketMatch[];
}

/** A stage box, placed on the grid by the rounds it spans. */
interface StageBox {
  key: string;
  title: string;
  span: StageSpan;
  /** 1-based CSS grid lines. */
  rowStart: number;
  rowEnd: number;
  column: number;
  cells: BuilderCell[];
}

@Component({
  selector: 'pdz-stage-builder',
  imports: [
    CommonModule,
    FormsModule,
    CdkDrag,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDropListGroup,
    // The grid scrolls inside its own pane, so the drag auto-scroller has to be
    // told about it — it only follows scroll containers the CDK knows.
    CdkScrollable,
    IconComponent,
    MatchCardComponent,
    StageWiresComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stage-builder.component.html',
  styleUrl: './stage-builder.component.scss',
})
export class StageBuilderComponent
  implements OnChanges, AfterViewChecked, OnDestroy
{
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) draft!: BuilderDraft;
  /**
   * Seeded teams per stage key, in seed order.
   *
   * Keyed by stage rather than flat because seed numbers are only meaningful
   * inside a stage — seed 1 of a group and seed 1 of the playoffs are
   * different teams, and one shared list would render whichever it saw first
   * for both.
   */
  @Input() teamsByStage = new Map<string, BracketTeamFlex[]>();
  @Input() editable = false;

  @Output() draftChange = new EventEmitter<BuilderDraft>();
  @Output() editMatch = new EventEmitter<string>();
  /** Asks the host to add a stage whose first match sits in this round. */
  @Output() addStage = new EventEmitter<number>();

  @ViewChild('grid') private gridRef?: ElementRef<HTMLElement>;

  protected stages: StageBox[] = [];
  /** Distinct content columns the stages occupy — sets the grid template. */
  protected columnCount = 1;
  protected wires: Wire[] = [];
  protected gridWidth = 0;
  protected gridHeight = 0;
  /** Minimum height of the gap above each row, sized to the wires crossing it. */
  protected corridorHeights: number[] = [];

  /** Where to park a stage that has no matches to measure yet. */
  private emptyStageRounds = new Map<string, number>();
  private resizeObserver?: ResizeObserver;
  /** Set when the DOM has changed in a way that invalidates the wire geometry. */
  private remeasureQueued = true;

  ngOnChanges(): void {
    this.rebuild();
    this.remeasureQueued = true;
  }

  ngAfterViewChecked(): void {
    if (!this.remeasureQueued) return;
    this.remeasureQueued = false;
    // Measuring forces layout, so it happens once per change outside Angular
    // and only re-enters if the wires actually moved.
    this.zone.runOutsideAngular(() =>
      requestAnimationFrame(() => this.measure()),
    );
    this.observeGrid();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  // ─── Grid model ────────────────────────────────────────────────────────────

  get rounds(): BuilderRound[] {
    return this.draft?.rounds ?? [];
  }

  protected trackRound = (_: number, round: BuilderRound) => round.key;
  protected trackStage = (_: number, stage: StageBox) => stage.key;
  protected trackCell = (_: number, cell: BuilderCell) => cell.id;
  protected trackMatch = (_: number, match: FlexBracketMatch) => match.id;

  /** Every cell id, so each drop list accepts drags from all the others. */
  protected cellIds: string[] = [];

  protected labels = new Map<string, string>();

  /** The teams a slot in this stage numbers its seeds against. */
  protected teamsFor(stageKey: string): BracketTeamFlex[] {
    return this.teamsByStage.get(stageKey) ?? [];
  }

  private rebuild(): void {
    if (!this.draft) return;

    const spans = stageSpans(this.draft, this.emptyStageRounds);
    const titleOf = (key: string) =>
      this.draft.stages.find((s) => s.key === key)?.name ?? key;
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

      return {
        key: span.key,
        title: titleOf(span.key),
        span,
        rowStart: span.firstRound + 1,
        rowEnd: span.lastRound + 2,
        // Column 1 is the round gutter; each column then owns a pair — its wire
        // band, then its content — so column n's content line is 3 + 2n.
        column: 3 + (columnOf.get(span.key) ?? 0) * 2,
        cells: rounds.map((round) => ({
          // Becomes a DOM id, so it has to stay a valid CSS selector —
          // stage keys are slugs, but a separator like ":" would not be.
          id: `cell_${span.key}_${round}`,
          stageKey: span.key,
          round,
          inSpan: round >= span.firstRound && round <= span.lastRound,
          matches: cellMatches(this.draft.matches, span.key, round),
        })),
      };
    });

    this.labels = this.buildLabels();
    // Recomputed with the cells rather than read per binding: every cell lists
    // every other, so a getter here would be quadratic on each check.
    this.cellIds = this.stages.flatMap((s) => s.cells.map((c) => c.id));
    this.corridorHeights = this.computeCorridorHeights();
  }

  /**
   * Hands each stage the rounds outside its span that it may still be dropped
   * into — the drop targets that let a match leave the rows its stage occupies.
   *
   * A span is derived from where a stage's matches sit, so a card dropped on one
   * of these simply makes the box taller; nothing has to resize the stage
   * explicitly. Rounds another stage already occupies in the same column are
   * left alone, since the two would land on the same grid cell.
   */
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
      round < span.firstRound ? span.firstRound - round : round - span.lastRound;

    for (const column of byColumn.values()) {
      // Sorted so that a gap equidistant from the stages either side of it goes
      // to the upper one, rather than to whichever the draft happened to list
      // first.
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

  /** "Match 1", "Match 2", … per stage, so a slot can say what it waits on. */
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

  /**
   * How much clear space each row needs above it. The wires are routed through
   * these gaps, so the gaps have to be tall enough before anything is drawn —
   * which means asking the router for its lane counts up front.
   */
  private computeCorridorHeights(): number[] {
    const { corridorLanes } = planRoutes(this.draft.matches);
    return Array.from({ length: this.rounds.length + 1 }, (_, i) =>
      requiredCorridorHeight(corridorLanes.get(i) ?? 0),
    );
  }

  // ─── Measurement ───────────────────────────────────────────────────────────

  private observeGrid(): void {
    const grid = this.gridRef?.nativeElement;
    if (!grid || this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(grid);
  }

  /**
   * Reads the laid-out geometry back out of the DOM and re-routes the wires.
   *
   * Everything is converted to grid-relative coordinates so the canvas overlay,
   * which is positioned against the same element, shares one coordinate space
   * regardless of scrolling.
   */
  private measure(): void {
    const grid = this.gridRef?.nativeElement;
    if (!grid) return;

    const origin = grid.getBoundingClientRect();
    const toLocal = (rect: DOMRect): WireRect => ({
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      w: rect.width,
      h: rect.height,
    });

    const rects = new Map<string, WireRect>();
    for (const node of Array.from(
      grid.querySelectorAll<HTMLElement>('[data-match-id]'),
    )) {
      const id = node.dataset['matchId'];
      if (id) rects.set(id, toLocal(node.getBoundingClientRect()));
    }

    const rows = this.rounds.map((_, index) => {
      const node = grid.querySelector<HTMLElement>(`[data-round="${index}"]`);
      if (!node) return { top: 0, bottom: 0 };
      const rect = toLocal(node.getBoundingClientRect());
      return { top: rect.y, bottom: rect.y + rect.h };
    });

    const bands = this.stages.map((stage) => {
      const node = grid.querySelector<HTMLElement>(
        `[data-band="${stage.key}"]`,
      );
      if (!node) return { key: stage.key, left: 0, right: 0 };
      const rect = toLocal(node.getBoundingClientRect());
      return { key: stage.key, left: rect.x, right: rect.x + rect.w };
    });

    const geometry: WireGeometry = { rects, rows, bands };
    const wires = computeWires(this.draft.matches, geometry);

    this.zone.run(() => {
      this.wires = wires;
      this.gridWidth = origin.width;
      this.gridHeight = origin.height;
      this.cdr.markForCheck();
    });
  }

  // ─── Editing ───────────────────────────────────────────────────────────────

  private commit(draft: BuilderDraft): void {
    this.draft = trimAutoRounds(padRounds(draft));
    this.rebuild();
    this.remeasureQueued = true;
    this.draftChange.emit(this.draft);
  }

  protected onDrop(event: CdkDragDrop<BuilderCell>): void {
    const matchId = event.item.data as string;
    const target = event.container.data;
    this.commit({
      ...this.draft,
      matches: moveMatch(
        this.draft.matches,
        matchId,
        target.stageKey,
        target.round,
        event.currentIndex,
      ),
    });
  }

  protected onAddMatch(cell: BuilderCell): void {
    this.commit({
      ...this.draft,
      matches: addMatchToRound(
        this.draft.matches,
        cell.stageKey,
        cell.round,
      ),
    });
  }

  protected onRemoveMatch(matchId: string): void {
    this.commit({
      ...this.draft,
      matches: deleteMatch(this.draft.matches, matchId),
    });
  }

  protected onInsertRound(index: number): void {
    this.commit(
      insertRound(this.draft, index, {
        name: `Round ${this.rounds.length + 1}`,
      }),
    );
  }

  protected onRemoveRound(index: number): void {
    if (!this.canRemoveRound(index)) return;
    this.commit(removeRound(this.draft, index));
  }

  protected canRemoveRound(index: number): boolean {
    return this.rounds.length > 1 && roundIsEmpty(this.draft, index);
  }

  protected onMoveRound(index: number, delta: -1 | 1): void {
    this.commit(reorderRounds(this.draft, index, index + delta));
  }

  protected onRenameRound(index: number, name: string): void {
    // Naming a round makes it the organizer's, so it outlives its matches.
    const rounds = this.rounds.map((round, i) =>
      i === index ? { ...claimRound(round), name } : round,
    );
    this.commit({ ...this.draft, rounds });
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
    this.commit({ ...this.draft, rounds });
  }

  /** `datetime-local` needs a bare local timestamp, not an ISO instant. */
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

  /** Moves a whole stage along the schedule, matches and all. */
  protected onMoveStage(stageKey: string, delta: -1 | 1): void {
    const span = this.stages.find((s) => s.key === stageKey)?.span;
    if (!span) return;

    // An empty stage has no matches to carry, so only its parking row moves.
    if (!this.draft.matches.some((m) => stageKeyOf(m) === stageKey)) {
      const round = Math.max(0, span.firstRound + delta);
      this.emptyStageRounds.set(stageKey, round);
      this.commit(padRounds({ ...this.draft }));
      return;
    }

    this.commit(moveStage(this.draft, stageKey, delta));
  }

  protected canMoveStage(stage: StageBox, delta: -1 | 1): boolean {
    return delta === 1 || stage.span.firstRound > 0;
  }
}

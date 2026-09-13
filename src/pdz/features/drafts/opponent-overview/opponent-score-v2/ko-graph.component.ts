import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import {
  KO_SIDES,
  KO_STATE_LABELS,
  KoGraph,
  KoNodeState,
  KoSide,
  cycleKoState,
  emptyKoGraph,
  koKey,
  koSideOf,
  koState,
  koCountBy,
  linkKo,
  outgoingKos,
  setKoNote,
  setKoState,
  toggleKoIndirect,
  toggleKoPreview,
  unlinkKo,
} from './ko-graph.model';

export type KoGraphPokemon = Pokemon<DraftOptions>;

export type KoGraphRosters = Record<KoSide, readonly KoGraphPokemon[]>;

type Point = { x: number; y: number };

type Anchor = {
  side: KoSide;
  left: number;
  right: number;
  cx: number;
  cy: number;
};

type WireKind = 'cross' | 'team' | 'self';

type Wire = {
  to: string;
  from: string;
  kind: WireKind;
  tone: string;
  indirect: boolean;
  note: string;
  d: string;
  label: Point;
};

type NodeView = {
  key: string;
  pokemon: KoGraphPokemon;
  state: KoNodeState;
  label: string;
  kos: number;
};

const DIRECTION: Readonly<Record<KoSide, number>> = { side1: 1, side2: -1 };

const DRAG_THRESHOLD = 5;

const LABEL_STEPS = 40;

let instances = 0;

function innerPoint(anchor: Anchor): Point {
  const edge = anchor.side === 'side1' ? anchor.right : anchor.left;
  return { x: edge + 4 * DIRECTION[anchor.side], y: anchor.cy };
}

function outerPoint(anchor: Anchor): Point {
  const edge = anchor.side === 'side1' ? anchor.left : anchor.right;
  return { x: edge - 6 * DIRECTION[anchor.side], y: anchor.cy };
}

function curve(p0: Point, p1: Point, p2: Point, p3: Point): string {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

function curveAt(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function labelPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  distance: number,
): Point {
  let point = p3;
  for (let step = 1; step <= LABEL_STEPS; step++) {
    point = curveAt(1 - step / LABEL_STEPS, p0, p1, p2, p3);
    if (Math.hypot(point.x - p3.x, point.y - p3.y) >= distance) break;
  }
  return point;
}

@Component({
  selector: 'pdz-ko-graph',
  templateUrl: './ko-graph.component.html',
  styleUrl: './ko-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    IconComponent,
    InputDirective,
    SpriteComponent,
    TooltipDirective,
  ],
})
export class KoGraphComponent {
  readonly rosters = input.required<KoGraphRosters>();
  readonly sideNames = input<Record<KoSide, string>>({
    side1: 'Team A',
    side2: 'Team B',
  });
  readonly graph = model<KoGraph>(emptyKoGraph());

  private readonly board = viewChild.required<ElementRef<HTMLElement>>('board');
  private readonly cards = viewChildren<ElementRef<HTMLElement>>('monCard');
  private readonly noteInput = viewChild<ElementRef<HTMLInputElement>>('note');

  private readonly anchors = signal<Record<string, Anchor>>({});
  private readonly boardWidth = signal(0);
  private readonly drag = signal<{
    from: string;
    point: Point;
    target: string | null;
  } | null>(null);

  private pending: {
    key: string;
    pointerId: number;
    x: number;
    y: number;
  } | null = null;

  protected readonly sides = KO_SIDES;
  protected readonly tones = ['side1', 'side2', 'team', 'self'] as const;
  protected readonly stateLabels = KO_STATE_LABELS;
  protected readonly markerSuffix = `ko-${++instances}`;

  protected readonly hovered = signal<string | null>(null);
  protected readonly editing = signal<string | null>(null);

  protected readonly keys = computed<Record<KoSide, string[]>>(() => {
    const rosters = this.rosters();
    return {
      side1: rosters.side1.map((pokemon) => koKey('side1', pokemon.id)),
      side2: rosters.side2.map((pokemon) => koKey('side2', pokemon.id)),
    };
  });

  protected readonly nodes = computed<Record<KoSide, NodeView[]>>(() => {
    const graph = this.graph();
    const rosters = this.rosters();
    const build = (side: KoSide): NodeView[] =>
      rosters[side].map((pokemon) => {
        const key = koKey(side, pokemon.id);
        return {
          key,
          pokemon,
          state: koState(graph, key),
          label: pokemon.nickname || pokemon.name,
          kos: outgoingKos(graph, key).length,
        };
      });
    return { side1: build('side1'), side2: build('side2') };
  });

  protected readonly wires = computed<Wire[]>(() => {
    const anchors = this.anchors();
    const width = this.boardWidth();

    const roomOutside = (...cards: Anchor[]): number =>
      cards[0].side === 'side1'
        ? Math.min(...cards.map((card) => card.left))
        : width - Math.max(...cards.map((card) => card.right));

    const outwardBow = (room: number, cap: number): number =>
      Math.max(12, Math.min(cap, (room - 10) / 0.75));

    return this.graph()
      .edges.map((edge) => {
        const from = anchors[edge.from];
        const to = anchors[edge.to];
        if (!from || !to) return null;

        let kind: WireKind = 'cross';
        let reach = 96;
        let p0: Point;
        let p1: Point;
        let p2: Point;
        let p3: Point;

        if (edge.from === edge.to) {
          kind = 'self';
          const base = outerPoint(from);
          const bow = -DIRECTION[from.side] * outwardBow(roomOutside(from), 34);
          p0 = { x: base.x, y: base.y - 13 };
          p3 = { x: base.x, y: base.y + 13 };
          p1 = { x: base.x + bow, y: p0.y };
          p2 = { x: base.x + bow, y: p3.y };
          reach = 24;
        } else if (from.side === to.side) {
          kind = 'team';
          p0 = outerPoint(from);
          p3 = outerPoint(to);
          const bow =
            -DIRECTION[from.side] *
            outwardBow(
              roomOutside(from, to),
              Math.min(48, 16 + Math.abs(p3.y - p0.y) * 0.12),
            );
          p1 = { x: p0.x + bow, y: p0.y };
          p2 = { x: p3.x + bow, y: p3.y };
          reach = 44;
        } else {
          p0 = innerPoint(from);
          p3 = innerPoint(to);
          const dx = p3.x - p0.x;
          const turn = p0.x + dx * 0.3;
          p1 = { x: turn, y: p0.y };
          p2 = { x: turn, y: p3.y };
          reach = Math.max(44, Math.min(96, Math.abs(dx) * 0.35));
        }

        return {
          to: edge.to,
          from: edge.from,
          kind,
          tone:
            kind === 'self'
              ? 'self'
              : kind === 'team'
                ? 'team'
                : koSideOf(edge.from),
          indirect: edge.indirect,
          note: edge.note,
          d: curve(p0, p1, p2, p3),
          label: labelPoint(p0, p1, p2, p3, reach),
        } satisfies Wire;
      })
      .filter((wire): wire is Wire => wire !== null);
  });

  protected readonly dragLine = computed<string | null>(() => {
    const drag = this.drag();
    if (!drag) return null;
    const anchor = this.anchors()[drag.from];
    if (!anchor) return null;
    const outward =
      anchor.side === 'side1'
        ? drag.point.x < anchor.cx
        : drag.point.x > anchor.cx;
    const start = outward ? outerPoint(anchor) : innerPoint(anchor);
    return `M ${start.x} ${start.y} L ${drag.point.x} ${drag.point.y}`;
  });

  protected readonly dragSource = computed(() => this.drag()?.from ?? null);
  protected readonly dragTarget = computed(() => this.drag()?.target ?? null);

  protected readonly tally = computed(() => {
    const graph = this.graph();
    const keys = this.keys();
    const of = (side: KoSide) => ({
      played: koCountBy(graph, keys[side], 'played'),
      fainted: koCountBy(graph, keys[side], 'fainted'),
      preview: koCountBy(graph, keys[side], 'preview'),
    });
    return { side1: of('side1'), side2: of('side2') };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const observer = new ResizeObserver(() => this.measure());

    effect(() => {
      this.cards();
      this.rosters();
      observer.disconnect();
      observer.observe(this.board().nativeElement);
      this.measure();
    });

    effect(() => {
      const input = this.noteInput();
      if (input) input.nativeElement.select();
    });

    destroyRef.onDestroy(() => observer.disconnect());
  }

  protected onPointerDown(event: PointerEvent, key: string): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.pending = {
      key,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    this.board().nativeElement.setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    const pending = this.pending;
    if (!pending || pending.pointerId !== event.pointerId) return;

    if (!this.drag()) {
      const moved = Math.hypot(
        event.clientX - pending.x,
        event.clientY - pending.y,
      );
      if (moved < DRAG_THRESHOLD) return;
      this.measure();
      this.hovered.set(null);
    }

    this.drag.set({
      from: pending.key,
      point: this.toBoard(event.clientX, event.clientY),
      target: this.keyAt(event.clientX, event.clientY),
    });
  }

  protected onPointerUp(event: PointerEvent): void {
    const pending = this.pending;
    if (!pending || pending.pointerId !== event.pointerId) return;
    this.pending = null;

    const board = this.board().nativeElement;
    if (board.hasPointerCapture(event.pointerId)) {
      board.releasePointerCapture(event.pointerId);
    }

    const drag = this.drag();
    this.drag.set(null);
    if (!drag) {
      this.cycle(pending.key);
      return;
    }

    const target = drag.target;
    if (target) this.graph.update((graph) => linkKo(graph, drag.from, target));
  }

  protected onPointerCancel(): void {
    this.pending = null;
    this.drag.set(null);
  }

  protected onCardKey(event: KeyboardEvent, key: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.cycle(key);
  }

  protected markerFor(wire: Wire): string {
    return `url(#${this.markerSuffix}-${wire.tone})`;
  }

  protected onPreview(event: Event, key: string): void {
    event.stopPropagation();
    this.graph.update((graph) => toggleKoPreview(graph, key));
  }

  protected onWireClick(to: string): void {
    this.editing.set(null);
    this.graph.update((graph) => toggleKoIndirect(graph, to));
  }

  protected onWireRemove(to: string): void {
    this.editing.set(null);
    this.graph.update((graph) => unlinkKo(graph, to));
  }

  protected onNoteCommit(to: string, value: string): void {
    this.editing.set(null);
    this.graph.update((graph) => setKoNote(graph, to, value));
  }

  protected onNoteKey(event: KeyboardEvent, to: string, note: string): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter') {
      this.onNoteCommit(to, input.value);
      return;
    }
    if (event.key === 'Escape') {
      event.stopPropagation();
      input.value = note;
      this.editing.set(null);
    }
  }

  protected clear(): void {
    this.graph.set(emptyKoGraph());
  }

  protected fill(side: KoSide): void {
    const keys = this.keys()[side];
    this.graph.update((graph) =>
      keys.reduce(
        (next, key) =>
          koState(next, key) === 'benched'
            ? setKoState(next, key, 'played')
            : next,
        graph,
      ),
    );
  }

  private cycle(key: string): void {
    this.editing.set(null);
    this.graph.update((graph) => cycleKoState(graph, key));
  }

  private measure(): void {
    const board = this.board().nativeElement;
    const base = board.getBoundingClientRect();
    const next: Record<string, Anchor> = {};

    for (const card of this.cards()) {
      const element = card.nativeElement;
      const key = element.dataset['koKey'];
      if (!key) continue;
      const rect = element.getBoundingClientRect();
      const left = rect.left - base.left;
      next[key] = {
        side: element.dataset['koSide'] as KoSide,
        left,
        right: left + rect.width,
        cx: left + rect.width / 2,
        cy: rect.top - base.top + rect.height / 2,
      };
    }

    this.anchors.set(next);
    this.boardWidth.set(base.width);
  }

  private toBoard(clientX: number, clientY: number): Point {
    const base = this.board().nativeElement.getBoundingClientRect();
    return { x: clientX - base.left, y: clientY - base.top };
  }

  private keyAt(clientX: number, clientY: number): string | null {
    const element = document.elementFromPoint(clientX, clientY);
    const card = element?.closest<HTMLElement>('[data-ko-key]');
    return card?.dataset['koKey'] ?? null;
  }
}

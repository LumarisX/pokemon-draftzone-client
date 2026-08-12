import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { WheelOptionsComponent } from './wheel-options/wheel-options.component';
import { WheelStorageService } from './wheel-storage.service';
import {
  clampWeight,
  defaultItems,
  MAX_HISTORY,
  MAX_LABEL_LENGTH,
  MAX_WEIGHT,
  MIN_WEIGHT,
  normalizeLabel,
  StoredWheelItem,
  WheelHistoryEntry,
  WheelItem,
  WheelOptions,
} from './wheel.model';

type WheelSlice = {
  id: number;
  label: string;
  weight: number;
  color: string;
  start: number;
  center: number;
  sweep: number;
  path: string;
  strokeWidth: number;
  labelText: string;
  labelX: number;
  labelY: number;
  labelRotate: number;
  showLabel: boolean;
};

type DrumBand = {
  key: string;
  label: string;
  color: string;
  top: number;
  height: number;
  labelTop: number;
  transform: string;
  showLabel: boolean;
  active: boolean;
};

const CENTER = 100;
const RADIUS = 88;
const LABEL_RADIUS = 58;
const PALETTE_SIZE = 10;

const POINTER_ANGLE = 90;

const DRUM_DEPTH = 0.32;

// A barrel in perspective can only ever show the arc in front of its silhouette
// (at acos(depth)), so the curve has to relax as the rim opens up: past
// FLAT_END the drum is a straight ribbon and any arc up to a full turn fits.
const FLAT_START = 60;
const FLAT_END = 90;
const DRUM_BLEED = 0.15;

type DrumShape = {
  depth: number;
  flat: number;
};

const MIN_BAND_LABEL_PERCENT = 3.5;

const MIN_LABEL_SWEEP = 10;
const MAX_WHEEL_LABEL = 16;
const SLICE_STROKE = 0.6;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function signedAngle(degrees: number): number {
  return normalizeAngle(degrees + 180) - 180;
}

function round(value: number, places = 3): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function pointAt(angle: number, radius: number): { x: number; y: number } {
  return {
    x: round(CENTER + radius * Math.sin(toRadians(angle))),
    y: round(CENTER - radius * Math.cos(toRadians(angle))),
  };
}

function drumShape(halfArc: number): DrumShape {
  const flat = Math.min(
    1,
    Math.max(0, (halfArc - FLAT_START) / (FLAT_END - FLAT_START)),
  );
  return { depth: DRUM_DEPTH * (1 - flat), flat };
}

function flatten(curved: number, straight: number, flat: number): number {
  return curved * (1 - flat) + straight * flat;
}

function rimOffset(angle: number, depth: number): number {
  const radians = toRadians(angle);
  return Math.sin(radians) / (1 - depth * Math.cos(radians));
}

function drumProject(angle: number, halfArc: number, shape: DrumShape): number {
  const curved =
    shape.flat < 1
      ? rimOffset(angle, shape.depth) / rimOffset(halfArc, shape.depth)
      : 0;
  return 50 + 50 * flatten(curved, angle / halfArc, shape.flat);
}

function drumPerspective(angle: number, shape: DrumShape): number {
  const { depth, flat } = shape;
  return flatten(
    (1 - depth) / (1 - depth * Math.cos(toRadians(angle))),
    1,
    flat,
  );
}

function drumSqueeze(angle: number, shape: DrumShape): number {
  const { depth, flat } = shape;
  const cos = Math.cos(toRadians(angle));
  const scale = 1 - depth * cos;
  return flatten(
    Math.max(0, ((cos - depth) / (scale * scale)) * (1 - depth)),
    1,
    flat,
  );
}

@Component({
  selector: 'pdz-wheel',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    IconComponent,
    WheelOptionsComponent,
  ],
  templateUrl: './wheel.component.html',
  styleUrl: './wheel.component.scss',
})
export class WheelComponent implements OnDestroy {
  private readonly storage = inject(WheelStorageService);

  private nextId = 1;
  private nextHistoryId = 1;
  private frame?: number;
  private copiedTimeout?: ReturnType<typeof setTimeout>;

  readonly items = signal<WheelItem[]>(this.restoreItems());
  readonly options = signal<WheelOptions>(this.storage.loadOptions());
  readonly history = signal<WheelHistoryEntry[]>(this.restoreHistory());
  readonly rotation = signal(0);
  readonly spinning = signal(false);
  private readonly winnerId = signal<number | null>(null);
  readonly winnerActed = signal(false);
  readonly winnerCopied = signal(false);

  constructor() {
    effect(() => this.storage.saveItems(this.storedItems()));
    effect(() => this.storage.saveOptions(this.options()));
    effect(() => this.storage.saveHistory(this.history()));
  }

  readonly draftLabel = signal('');

  readonly totalWeight = computed(() =>
    this.items().reduce((sum, item) => sum + item.weight, 0),
  );

  readonly visibleSlices = computed<WheelSlice[]>(() => {
    const needle = normalizeLabel(this.draftLabel());
    if (!needle) return this.slices();
    return this.slices().filter((slice) =>
      normalizeLabel(slice.label).includes(needle),
    );
  });

  readonly duplicate = computed<WheelSlice | null>(() => {
    const needle = normalizeLabel(this.draftLabel());
    if (!needle) return null;
    return (
      this.slices().find((slice) => normalizeLabel(slice.label) === needle) ??
      null
    );
  });

  readonly filtering = computed(() => normalizeLabel(this.draftLabel()) !== '');

  readonly storedItems = computed<StoredWheelItem[]>(() =>
    this.items().map(({ label, weight }) => ({ label, weight })),
  );

  readonly slices = computed<WheelSlice[]>(() => {
    const items = this.items();
    const total = this.totalWeight();
    if (!items.length || total <= 0) return [];

    let cursor = 0;
    return items.map((item, index) => {
      const sweep = (item.weight / total) * 360;
      const start = cursor;
      const center = start + sweep / 2;
      cursor += sweep;

      const labelPoint = pointAt(center, LABEL_RADIUS);
      return {
        id: item.id,
        label: item.label,
        weight: item.weight,
        color: `var(--wheel-slice-${this.paletteIndex(index, items.length)})`,
        start,
        center,
        sweep,
        path: this.slicePath(start, sweep, items.length === 1),
        strokeWidth: round(Math.min(SLICE_STROKE, sweep * 0.25), 4),
        labelText: this.fitLabel(item.label),
        labelX: labelPoint.x,
        labelY: labelPoint.y,
        labelRotate: round(center - 90),
        showLabel: sweep >= MIN_LABEL_SWEEP,
      };
    });
  });

  readonly pointerSlice = computed<WheelSlice | null>(() => {
    const slices = this.slices();
    if (!slices.length) return null;

    const angle = normalizeAngle(POINTER_ANGLE - this.rotation());
    return (
      slices.find(
        (slice) => angle >= slice.start && angle < slice.start + slice.sweep,
      ) ?? slices[slices.length - 1]
    );
  });

  readonly pointerColor = computed<string | null>(
    () => this.pointerSlice()?.color ?? null,
  );

  readonly drumBands = computed<DrumBand[]>(() => {
    const rotation = this.rotation();
    const halfArc = this.options().rimArc / 2;
    const shape = drumShape(halfArc);
    const activeId = this.pointerSlice()?.id;
    const bands: DrumBand[] = [];

    for (const slice of this.slices()) {
      const origin = signedAngle(slice.start + rotation - POINTER_ANGLE);

      for (const turn of [-360, 0, 360]) {
        const from = Math.max(origin + turn, -halfArc);
        const to = Math.min(origin + turn + slice.sweep, halfArc);
        if (to <= from) continue;

        const top = drumProject(from, halfArc, shape);
        const height = drumProject(to, halfArc, shape) - top;
        const middle = (from + to) / 2;

        const seenFrom = Math.max(top, 0);
        const seenTo = Math.min(top + height, 100);

        bands.push({
          key: `${slice.id}:${turn}`,
          label: slice.label,
          color: slice.color,
          top: round(top),
          height: round(height + DRUM_BLEED),
          labelTop: round((((seenFrom + seenTo) / 2 - top) / height) * 100),
          transform: `translate(-50%, -50%) scaleX(${round(drumPerspective(middle, shape), 4)}) scaleY(${round(drumSqueeze(middle, shape), 4)})`,
          showLabel: height >= MIN_BAND_LABEL_PERCENT,
          active: slice.id === activeId,
        });
      }
    }

    return bands;
  });

  readonly pinnedLabel = computed<{ label: string; color: string } | null>(
    () => {
      const active = this.drumBands().find((band) => band.active);
      if (!active) {
        const slice = this.pointerSlice();
        return slice ? { label: slice.label, color: slice.color } : null;
      }
      return active.showLabel
        ? null
        : { label: active.label, color: active.color };
    },
  );

  protected readonly maxWeight = MAX_WEIGHT;

  readonly canSpin = computed(
    () => !this.spinning() && this.items().length > 1,
  );

  readonly winner = computed<WheelSlice | null>(() => {
    const id = this.winnerId();
    return id === null
      ? null
      : (this.slices().find((slice) => slice.id === id) ?? null);
  });

  ngOnDestroy(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    clearTimeout(this.copiedTimeout);
  }

  copyWinner(label: string): void {
    navigator.clipboard
      .writeText(label)
      .then(() => {
        clearTimeout(this.copiedTimeout);
        this.winnerCopied.set(true);
        this.copiedTimeout = setTimeout(
          () => this.winnerCopied.set(false),
          1500,
        );
      })
      .catch(() => {});
  }

  addItem(): void {
    const label = this.draftLabel().trim().slice(0, MAX_LABEL_LENGTH);
    if (this.spinning() || !label) return;

    this.items.update((items) => [
      ...items,
      { id: this.nextId++, label, weight: MIN_WEIGHT },
    ]);
    this.draftLabel.set('');
  }

  adjust(id: number, delta: number): void {
    const current = this.items().find((item) => item.id === id);
    if (current) this.setWeight(id, current.weight + delta);
  }

  typeWeight(id: number, raw: string): void {
    const parsed = Number.parseInt(raw.replace(/\D/g, ''), 10);
    if (Number.isFinite(parsed)) this.setWeight(id, parsed);
  }

  restoreWeight(event: Event, weight: number): void {
    (event.target as HTMLInputElement).value = String(weight);
  }

  private setWeight(id: number, weight: number): void {
    if (this.spinning()) return;

    this.items.update((items) =>
      items.map((item) =>
        item.id === id ? { ...item, weight: clampWeight(weight) } : item,
      ),
    );
  }

  rename(id: number, label: string): void {
    if (this.spinning()) return;

    this.items.update((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, label: label.slice(0, MAX_LABEL_LENGTH) }
          : item,
      ),
    );
  }

  remove(id: number): void {
    if (this.spinning()) return;

    this.items.update((items) => items.filter((item) => item.id !== id));
    if (this.winnerId() === id) this.winnerId.set(null);
  }

  dropItem(event: CdkDragDrop<WheelItem[]>): void {
    if (this.spinning() || this.filtering()) return;
    if (event.previousIndex === event.currentIndex) return;

    this.items.update((items) => {
      const next = [...items];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      return next;
    });
  }

  decreaseWinner(): void {
    if (this.winnerActed()) return;
    const winner = this.winner();
    if (!winner) return;

    this.winnerActed.set(true);
    this.adjust(winner.id, -1);
  }

  removeWinner(): void {
    if (this.winnerActed()) return;
    const winner = this.winner();
    if (!winner) return;

    this.winnerActed.set(true);
    this.remove(winner.id);
  }

  applyOptions(options: WheelOptions): void {
    this.options.set(options);
  }

  importItems(imported: StoredWheelItem[]): void {
    if (this.spinning()) return;

    this.items.set(imported.map((item) => ({ ...item, id: this.nextId++ })));
    this.winnerId.set(null);
  }

  clearHistory(): void {
    this.history.set([]);
  }

  clockTime(at: number): string {
    return new Date(at).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  spin(): void {
    const slices = this.slices();
    if (!this.canSpin() || slices.length < 2) return;

    const target = this.pickWeighted(slices);
    const margin = Math.min(target.sweep * 0.2, 6);
    const landing =
      target.start + margin + Math.random() * (target.sweep - margin * 2);

    const { spinSeconds, minTurns } = this.options();
    const from = this.rotation();
    const turns = minTurns + Math.floor(Math.random() * 3);
    const to =
      from + normalizeAngle(POINTER_ANGLE - landing - from) + turns * 360;
    const duration = spinSeconds * 1000;
    const startedAt = performance.now();

    this.winnerId.set(null);
    this.spinning.set(true);

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      this.rotation.set(from + (to - from) * eased);

      if (progress < 1) {
        this.frame = requestAnimationFrame(step);
        return;
      }

      this.frame = undefined;
      this.rotation.set(normalizeAngle(to));
      this.spinning.set(false);

      const won = this.items().find((item) => item.id === target.id);
      if (!won) return;

      this.winnerActed.set(false);
      this.winnerId.set(won.id);
      this.record(won.label, target.color);
    };

    this.frame = requestAnimationFrame(step);
  }

  private record(label: string, color: string): void {
    this.history.update((entries) =>
      [
        { id: this.nextHistoryId++, label, color, at: Date.now() },
        ...entries,
      ].slice(0, MAX_HISTORY),
    );
  }

  private restoreItems(): WheelItem[] {
    const source = this.storage.loadItems() ?? defaultItems();
    return source.map((item) => ({ ...item, id: this.nextId++ }));
  }

  private restoreHistory(): WheelHistoryEntry[] {
    const entries = this.storage.loadHistory();
    this.nextHistoryId = entries.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
    return entries;
  }

  private pickWeighted(slices: WheelSlice[]): WheelSlice {
    let roll = Math.random() * this.totalWeight();
    for (const slice of slices) {
      roll -= slice.weight;
      if (roll <= 0) return slice;
    }
    return slices[slices.length - 1];
  }

  private paletteIndex(index: number, count: number): number {
    const color = index % PALETTE_SIZE;
    return index === count - 1 && color === 0 && count > 1 ? 1 : color;
  }

  private slicePath(start: number, sweep: number, full: boolean): string {
    if (full) {
      const top = CENTER - RADIUS;
      const bottom = CENTER + RADIUS;
      return `M ${CENTER} ${top} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER} ${bottom} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER} ${top} Z`;
    }

    const from = pointAt(start, RADIUS);
    const to = pointAt(start + sweep, RADIUS);
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${from.x} ${from.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${to.x} ${to.y} Z`;
  }

  private fitLabel(label: string): string {
    if (label.length <= MAX_WHEEL_LABEL) return label;
    return `${label.slice(0, MAX_WHEEL_LABEL - 1).trimEnd()}…`;
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { BINDER_ROSTER, BinderKind } from './binder-roster.data';

export const CARDS_PER_SHEET = 9;
export const MIN_POCKET_AXIS = 1;
export const MAX_POCKET_AXIS = 8;

const HISTORY_LIMIT = 50;
const STORAGE_KEY = 'binderData';
const DEFAULT_COLS = 4;
const DEFAULT_ROWS = 4;

function clampAxis(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(
    Math.max(Math.trunc(parsed), MIN_POCKET_AXIS),
    MAX_POCKET_AXIS,
  );
}

export type SortMode = 'dex' | 'alpha' | 'type' | 'custom';

export const SORT_MODES: readonly { id: SortMode; label: string }[] = [
  { id: 'dex', label: 'Pokédex number' },
  { id: 'alpha', label: 'Alphabetical' },
  { id: 'type', label: 'Type' },
  { id: 'custom', label: 'Custom' },
];

const TYPE_ORDER = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
];

const TYPE_RANK = new Map(TYPE_ORDER.map((type, index) => [type, index]));

export type PrintScope = 'missing' | 'all';

export type BinderCard = {
  id: string;
  name: string;
  num: number;
  kind: BinderKind;
  types: string[];
};

export type LayoutEntry = {
  key: string;
  id: string | null;
};

export type BinderSlot = {
  key: string;
  index: number;
  page: number;
  pocket: number;
  gridRow: number;
  gridColumn: number;
  card: BinderCard | null;
  copy: number;
  copies: number;
};

export type MarkResult =
  | { status: 'marked'; card: BinderCard; key: string }
  | { status: 'already'; card: BinderCard; key: string }
  | { status: 'ambiguous'; matches: BinderCard[] }
  | { status: 'missing' };

export type BinderSummary = { id: string; name: string; cards: number };

type BinderDoc = {
  id: string;
  name: string;
  layout: LayoutEntry[];
  owned: string[];
  hidden: string[];
  cols: number;
  rows: number;
  showCosmetic: boolean;
  sort: SortMode;
};

type Persisted = {
  version: 2;
  activeId: string;
  binders: BinderDoc[];
};

type LegacyPersisted = {
  layout?: string[];
  owned?: string[];
  hidden?: string[];
  cols?: number;
  rows?: number;
  pageFormat?: string;
  showCosmetic?: boolean;
  sort?: SortMode;
};

type Snapshot = {
  layout: LayoutEntry[];
  owned: ReadonlySet<string>;
  hidden: ReadonlySet<string>;
  showCosmetic: boolean;
  sort: SortMode;
};

export const ROSTER: readonly BinderCard[] = BINDER_ROSTER.map(
  ([id, name, num, kind, types]) => ({
    id,
    name,
    num,
    kind,
    types: types.split('/'),
  }),
);

const ROSTER_INDEX = new Map(ROSTER.map((card) => [card.id, card]));
const DEX_RANK = new Map(ROSTER.map((card, index) => [card.id, index]));

export const COSMETIC_COUNT = ROSTER.filter(
  (card) => card.kind === 'cosmetic',
).length;

export function getCard(id: string): BinderCard | undefined {
  return ROSTER_INDEX.get(id);
}

function typeRank(card: BinderCard, slot: number): number {
  const type = card.types[slot];
  if (type === undefined) return -1;
  return TYPE_RANK.get(type) ?? TYPE_ORDER.length;
}

function comparator(mode: SortMode): (a: BinderCard, b: BinderCard) => number {
  if (mode === 'alpha') return (a, b) => a.name.localeCompare(b.name);
  if (mode === 'type') {
    return (a, b) =>
      typeRank(a, 0) - typeRank(b, 0) ||
      typeRank(a, 1) - typeRank(b, 1) ||
      DEX_RANK.get(a.id)! - DEX_RANK.get(b.id)!;
  }
  return (a, b) => DEX_RANK.get(a.id)! - DEX_RANK.get(b.id)!;
}

function orderedIds(mode: SortMode, showCosmetic: boolean): string[] {
  const cards = ROSTER.filter(
    (card) => showCosmetic || card.kind !== 'cosmetic',
  );
  if (mode === 'custom' || mode === 'dex') return cards.map((card) => card.id);
  return [...cards].sort(comparator(mode)).map((card) => card.id);
}

@Injectable({ providedIn: 'root' })
export class BinderStore {
  private keySeq = 0;
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private inactive = new Map<string, BinderDoc>();

  readonly layout = signal<LayoutEntry[]>([]);
  readonly owned = signal<ReadonlySet<string>>(new Set());
  readonly hidden = signal<ReadonlySet<string>>(new Set());
  readonly cols = signal(DEFAULT_COLS);
  readonly rows = signal(DEFAULT_ROWS);
  readonly showCosmetic = signal(false);
  readonly sort = signal<SortMode>('dex');
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  readonly binders = signal<BinderSummary[]>([]);
  readonly activeId = signal('');
  readonly activeName = signal('');

  readonly pageSize = computed(() => this.cols() * this.rows());

  readonly slots = computed<BinderSlot[]>(() => {
    const size = this.pageSize();
    const cols = this.cols();
    const counts = new Map<string, number>();
    const totals = new Map<string, number>();
    for (const entry of this.layout()) {
      if (entry.id) totals.set(entry.id, (totals.get(entry.id) ?? 0) + 1);
    }

    return this.layout().map((entry, index) => {
      const card = entry.id ? (ROSTER_INDEX.get(entry.id) ?? null) : null;
      const copy = entry.id ? (counts.get(entry.id) ?? 0) + 1 : 0;
      if (entry.id) counts.set(entry.id, copy);
      const pageIndex = Math.floor(index / size);
      const within = index % size;
      return {
        key: entry.key,
        index,
        page: pageIndex + 1,
        pocket: within + 1,
        gridRow: Math.floor(within / cols) + 1,
        gridColumn: pageIndex * (cols + 1) + (within % cols) + 1,
        card,
        copy,
        copies: entry.id ? (totals.get(entry.id) ?? 0) : 0,
      };
    });
  });

  readonly missing = computed(() => {
    const owned = this.owned();
    return this.slots().filter((slot) => slot.card && !owned.has(slot.key));
  });

  readonly printScope = signal<PrintScope>('missing');
  readonly printFrom = signal<number | null>(null);
  readonly printTo = signal<number | null>(null);

  readonly printTargets = computed<BinderSlot[]>(() => {
    const owned = this.owned();
    const scope = this.printScope();
    const from = this.printFrom();
    const to = this.printTo();
    return this.slots().filter((slot) => {
      if (!slot.card) return false;
      if (scope === 'missing' && owned.has(slot.key)) return false;
      if (from !== null && slot.page < from) return false;
      if (to !== null && slot.page > to) return false;
      return true;
    });
  });

  readonly sheets = computed<BinderSlot[][]>(() => {
    const targets = this.printTargets();
    const sheets: BinderSlot[][] = [];
    for (let i = 0; i < targets.length; i += CARDS_PER_SHEET) {
      sheets.push(targets.slice(i, i + CARDS_PER_SHEET));
    }
    return sheets;
  });

  readonly removed = computed(() => {
    const hidden = this.hidden();
    return ROSTER.filter((card) => hidden.has(card.id));
  });

  readonly stats = computed(() => {
    const slots = this.slots();
    const ownedKeys = this.owned();
    const cards = slots.filter((slot) => slot.card).length;
    const owned = slots.filter(
      (slot) => slot.card && ownedKeys.has(slot.key),
    ).length;
    const species = new Set(
      slots.flatMap((slot) => (slot.card ? [slot.card.id] : [])),
    ).size;
    return {
      cards,
      species,
      duplicates: cards - species,
      owned,
      missing: cards - owned,
      blanks: slots.length - cards,
      pages: Math.ceil(slots.length / this.pageSize()),
      percent: cards ? Math.round((owned / cards) * 100) : 0,
    };
  });

  readonly pageProgress = computed(() => {
    const ownedKeys = this.owned();
    const totals = new Map<number, { owned: number; cards: number }>();
    for (const slot of this.slots()) {
      if (!slot.card) continue;
      const entry = totals.get(slot.page) ?? { owned: 0, cards: 0 };
      entry.cards += 1;
      if (ownedKeys.has(slot.key)) entry.owned += 1;
      totals.set(slot.page, entry);
    }
    return totals;
  });

  constructor() {
    const persisted = this.read();
    for (const doc of persisted.binders) {
      this.inactive.set(doc.id, doc);
    }
    this.keySeq = persisted.binders.reduce(
      (max, doc) =>
        doc.layout.reduce((inner, entry) => {
          const n = Number(entry.key.slice(1));
          return Number.isFinite(n) ? Math.max(inner, n) : inner;
        }, max),
      0,
    );
    this.loadDoc(persisted.activeId);
    this.syncSummaries();
  }

  private nextKey(): string {
    return `k${++this.keySeq}`;
  }

  private newId(): string {
    return `b${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  }

  private freshLayout(showCosmetic: boolean): LayoutEntry[] {
    return orderedIds('dex', showCosmetic).map((id) => ({
      key: this.nextKey(),
      id,
    }));
  }

  private blankDoc(name: string): BinderDoc {
    return {
      id: this.newId(),
      name,
      layout: this.freshLayout(false),
      owned: [],
      hidden: [],
      cols: DEFAULT_COLS,
      rows: DEFAULT_ROWS,
      showCosmetic: false,
      sort: 'dex',
    };
  }

  private read(): Persisted {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    if (!raw) {
      const doc = this.blankDoc('My binder');
      return { version: 2, activeId: doc.id, binders: [doc] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const doc = this.blankDoc('My binder');
      return { version: 2, activeId: doc.id, binders: [doc] };
    }

    const asRecord = parsed as Partial<Persisted> & LegacyPersisted;
    if (Array.isArray(asRecord.binders) && asRecord.binders.length) {
      const binders = asRecord.binders.map((doc) => this.normalizeDoc(doc));
      const activeId = binders.some((doc) => doc.id === asRecord.activeId)
        ? asRecord.activeId!
        : binders[0].id;
      return { version: 2, activeId, binders };
    }

    const migrated = this.migrateLegacy(asRecord);
    return { version: 2, activeId: migrated.id, binders: [migrated] };
  }

  private normalizeDoc(doc: Partial<BinderDoc>): BinderDoc {
    const base = this.blankDoc(doc.name?.trim() || 'Binder');
    const layout = Array.isArray(doc.layout)
      ? doc.layout
          .filter(
            (entry): entry is LayoutEntry =>
              !!entry && typeof entry.key === 'string',
          )
          .map((entry) => ({
            key: entry.key,
            id:
              typeof entry.id === 'string' && ROSTER_INDEX.has(entry.id)
                ? entry.id
                : null,
          }))
      : base.layout;

    return {
      id: typeof doc.id === 'string' && doc.id ? doc.id : base.id,
      name: base.name,
      layout,
      owned: Array.isArray(doc.owned) ? doc.owned.filter((k) => !!k) : [],
      hidden: Array.isArray(doc.hidden)
        ? doc.hidden.filter((id) => ROSTER_INDEX.has(id))
        : [],
      cols: clampAxis(doc.cols, DEFAULT_COLS),
      rows: clampAxis(doc.rows, DEFAULT_ROWS),
      showCosmetic: doc.showCosmetic ?? false,
      sort: SORT_MODES.some((mode) => mode.id === doc.sort) ? doc.sort! : 'dex',
    };
  }

  private migrateLegacy(legacy: LegacyPersisted): BinderDoc {
    const doc = this.blankDoc('My binder');
    if (!Array.isArray(legacy.layout)) return doc;

    const ownedIds = new Set(legacy.owned ?? []);
    const ownedKeys: string[] = [];
    const layout: LayoutEntry[] = [];

    for (const raw of legacy.layout) {
      const key = this.nextKey();
      if (raw.startsWith('blank:')) {
        layout.push({ key, id: null });
        continue;
      }
      if (!ROSTER_INDEX.has(raw)) continue;
      layout.push({ key, id: raw });
      if (ownedIds.has(raw)) ownedKeys.push(key);
    }

    const legacyGrid = /^(\d+)x(\d+)$/.exec(legacy.pageFormat ?? '');
    return {
      ...doc,
      layout,
      owned: ownedKeys,
      hidden: (legacy.hidden ?? []).filter((id) => ROSTER_INDEX.has(id)),
      cols: clampAxis(legacy.cols ?? legacyGrid?.[1], DEFAULT_COLS),
      rows: clampAxis(legacy.rows ?? legacyGrid?.[2], DEFAULT_ROWS),
      showCosmetic: legacy.showCosmetic ?? false,
      sort: SORT_MODES.some((mode) => mode.id === legacy.sort)
        ? legacy.sort!
        : 'dex',
    };
  }

  private loadDoc(id: string): void {
    const doc = this.inactive.get(id);
    if (!doc) return;
    this.inactive.delete(id);

    this.activeId.set(doc.id);
    this.activeName.set(doc.name);
    this.sort.set(doc.sort);
    this.showCosmetic.set(doc.showCosmetic);
    this.hidden.set(new Set(doc.hidden));
    this.cols.set(doc.cols);
    this.rows.set(doc.rows);
    this.owned.set(new Set(doc.owned));
    this.layout.set(
      this.reconcile(
        doc.layout,
        new Set(doc.hidden),
        doc.sort,
        doc.showCosmetic,
      ),
    );

    this.undoStack = [];
    this.redoStack = [];
    this.syncHistory();
  }

  private serializeActive(): BinderDoc {
    return {
      id: this.activeId(),
      name: this.activeName(),
      layout: this.layout(),
      owned: [...this.owned()],
      hidden: [...this.hidden()],
      cols: this.cols(),
      rows: this.rows(),
      showCosmetic: this.showCosmetic(),
      sort: this.sort(),
    };
  }

  private allDocs(): BinderDoc[] {
    const active = this.serializeActive();
    const docs: BinderDoc[] = [];
    for (const summary of this.binders()) {
      docs.push(
        summary.id === active.id
          ? active
          : (this.inactive.get(summary.id) ?? active),
      );
    }
    if (!docs.some((doc) => doc.id === active.id)) docs.unshift(active);
    return docs;
  }

  private syncSummaries(): void {
    const active = this.serializeActive();
    const known = new Map<string, BinderDoc>(this.inactive);
    known.set(active.id, active);

    const existing = this.binders().map((summary) => summary.id);
    const ids = existing.length
      ? existing.filter((id) => known.has(id))
      : [...known.keys()];
    if (!ids.includes(active.id)) ids.push(active.id);

    this.binders.set(
      ids.map((id) => {
        const doc = known.get(id)!;
        return {
          id,
          name: doc.name,
          cards: doc.layout.filter((entry) => entry.id).length,
        };
      }),
    );
  }

  private reconcile(
    layout: LayoutEntry[],
    hidden: ReadonlySet<string>,
    mode: SortMode,
    showCosmetic: boolean,
  ): LayoutEntry[] {
    const order = orderedIds(mode === 'custom' ? 'dex' : mode, showCosmetic);
    const allowed = new Set(order);
    const result = layout.filter(
      (entry) => entry.id === null || allowed.has(entry.id),
    );
    const present = new Set(
      result.flatMap((entry) => (entry.id ? [entry.id] : [])),
    );

    let cursor = -1;
    for (const id of order) {
      if (present.has(id)) {
        cursor = result.findIndex((entry) => entry.id === id);
        continue;
      }
      if (hidden.has(id)) continue;
      cursor += 1;
      result.splice(cursor, 0, { key: this.nextKey(), id });
      present.add(id);
    }
    return result;
  }

  private capture(): Snapshot {
    return {
      layout: this.layout(),
      owned: this.owned(),
      hidden: this.hidden(),
      showCosmetic: this.showCosmetic(),
      sort: this.sort(),
    };
  }

  private applySnapshot(snapshot: Snapshot): void {
    this.layout.set(snapshot.layout);
    this.owned.set(snapshot.owned);
    this.hidden.set(snapshot.hidden);
    this.showCosmetic.set(snapshot.showCosmetic);
    this.sort.set(snapshot.sort);
  }

  private commit(change: () => void): void {
    const before = this.capture();
    change();
    this.undoStack.push(before);
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack.length = 0;
    this.syncHistory();
    this.syncSummaries();
    this.persist();
  }

  private syncHistory(): void {
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  private persist(): void {
    const payload: Persisted = {
      version: 2,
      activeId: this.activeId(),
      binders: this.allDocs(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      return;
    }
  }

  undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.redoStack.push(this.capture());
    this.applySnapshot(previous);
    this.syncHistory();
    this.syncSummaries();
    this.persist();
  }

  redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(this.capture());
    this.applySnapshot(next);
    this.syncHistory();
    this.syncSummaries();
    this.persist();
  }

  switchTo(id: string): void {
    if (id === this.activeId()) return;
    if (!this.binders().some((summary) => summary.id === id)) return;
    this.inactive.set(this.activeId(), this.serializeActive());
    this.loadDoc(id);
    this.syncSummaries();
    this.persist();
  }

  createBinder(name: string, copyActive = false): string {
    const trimmed = name.trim() || `Binder ${this.binders().length + 1}`;
    this.inactive.set(this.activeId(), this.serializeActive());

    const doc: BinderDoc = copyActive
      ? {
          ...this.serializeActive(),
          id: this.newId(),
          name: trimmed,
          layout: this.layout().map((entry) => ({ ...entry })),
        }
      : this.blankDoc(trimmed);

    this.inactive.set(doc.id, doc);
    this.binders.update((list) => [
      ...list,
      { id: doc.id, name: doc.name, cards: doc.layout.length },
    ]);
    this.loadDoc(doc.id);
    this.syncSummaries();
    this.persist();
    return doc.id;
  }

  renameBinder(name: string): void {
    const trimmed = name.trim();
    if (!trimmed || trimmed === this.activeName()) return;
    this.activeName.set(trimmed);
    this.syncSummaries();
    this.persist();
  }

  deleteBinder(id: string): boolean {
    if (this.binders().length < 2) return false;
    const remaining = this.binders().filter((summary) => summary.id !== id);
    if (remaining.length === this.binders().length) return false;

    this.inactive.delete(id);
    this.binders.set(remaining);
    if (id === this.activeId()) {
      this.inactive.set(
        remaining[0].id,
        this.inactive.get(remaining[0].id) ?? this.blankDoc(remaining[0].name),
      );
      this.loadDoc(remaining[0].id);
    }
    this.syncSummaries();
    this.persist();
    return true;
  }

  isOwned(key: string): boolean {
    return this.owned().has(key);
  }

  toggleOwned(key: string): void {
    this.commit(() => {
      const next = new Set(this.owned());
      if (!next.delete(key)) next.add(key);
      this.owned.set(next);
    });
  }

  setOwned(key: string, owned: boolean): void {
    if (this.owned().has(key) === owned) return;
    this.commit(() => {
      const next = new Set(this.owned());
      if (owned) next.add(key);
      else next.delete(key);
      this.owned.set(next);
    });
  }

  setRangeOwned(from: number, to: number, owned: boolean): void {
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    this.commit(() => {
      const next = new Set(this.owned());
      for (const slot of this.slots()) {
        if (slot.index < start || slot.index > end || !slot.card) continue;
        if (owned) next.add(slot.key);
        else next.delete(slot.key);
      }
      this.owned.set(next);
    });
  }

  setPageOwned(page: number, owned: boolean): void {
    this.commit(() => {
      const next = new Set(this.owned());
      for (const slot of this.slots()) {
        if (slot.page !== page || !slot.card) continue;
        if (owned) next.add(slot.key);
        else next.delete(slot.key);
      }
      this.owned.set(next);
    });
  }

  markByName(term: string): MarkResult {
    const needle = term.trim().toLowerCase();
    if (!needle) return { status: 'missing' };
    const normalized = needle.replace(/[^a-z0-9]/g, '');
    const slots = this.slots().filter((slot) => slot.card);

    const exactSlots = slots.filter(
      (slot) =>
        slot.card!.name.toLowerCase() === needle ||
        slot.card!.id === normalized,
    );
    if (exactSlots.length) return this.applyMark(exactSlots);

    const asNumber = Number(needle.replace(/^#/, ''));
    const matched =
      Number.isInteger(asNumber) && asNumber > 0
        ? slots.filter((slot) => slot.card!.num === asNumber)
        : slots.filter(
            (slot) =>
              slot.card!.name.toLowerCase().includes(needle) ||
              (normalized.length > 0 && slot.card!.id.includes(normalized)),
          );

    const species = new Map<string, BinderCard>();
    for (const slot of matched) species.set(slot.card!.id, slot.card!);
    if (species.size === 1) return this.applyMark(matched);
    if (species.size > 1) {
      return {
        status: 'ambiguous',
        matches: [...species.values()].slice(0, 8),
      };
    }
    return { status: 'missing' };
  }

  private applyMark(slots: BinderSlot[]): MarkResult {
    const owned = this.owned();
    const free = slots.find((slot) => !owned.has(slot.key));
    if (!free) {
      return { status: 'already', card: slots[0].card!, key: slots[0].key };
    }
    this.setOwned(free.key, true);
    return { status: 'marked', card: free.card!, key: free.key };
  }

  setPageGrid(cols: unknown, rows: unknown): void {
    const nextCols = clampAxis(cols, this.cols());
    const nextRows = clampAxis(rows, this.rows());
    if (nextCols === this.cols() && nextRows === this.rows()) return;
    this.cols.set(nextCols);
    this.rows.set(nextRows);
    this.persist();
  }

  setPrintScope(scope: PrintScope): void {
    this.printScope.set(scope);
  }

  setPrintRange(from: number | null, to: number | null): void {
    const pages = this.stats().pages;
    const clamp = (value: number | null) =>
      value === null || !Number.isFinite(value)
        ? null
        : Math.min(Math.max(Math.trunc(value), 1), pages);
    this.printFrom.set(clamp(from));
    this.printTo.set(clamp(to));
  }

  setSort(mode: SortMode): void {
    if (mode === this.sort()) return;
    this.commit(() => {
      this.sort.set(mode);
      if (mode === 'custom') return;
      const compare = comparator(mode);
      this.layout.set(
        this.layout()
          .filter((entry) => entry.id !== null)
          .sort((a, b) =>
            compare(ROSTER_INDEX.get(a.id!)!, ROSTER_INDEX.get(b.id!)!),
          ),
      );
    });
  }

  setShowCosmetic(show: boolean): void {
    if (show === this.showCosmetic()) return;
    this.commit(() => {
      this.showCosmetic.set(show);
      this.layout.set(
        this.reconcile(this.layout(), this.hidden(), this.sort(), show),
      );
    });
  }

  move(from: number, to: number): void {
    if (from === to) return;
    this.commit(() => {
      const layout = [...this.layout()];
      const [entry] = layout.splice(from, 1);
      layout.splice(to, 0, entry);
      this.layout.set(layout);
      this.sort.set('custom');
    });
  }

  insertBlank(index: number): void {
    this.commit(() => {
      const layout = [...this.layout()];
      layout.splice(index, 0, { key: this.nextKey(), id: null });
      this.layout.set(layout);
      this.sort.set('custom');
    });
  }

  appendBlank(): void {
    this.insertBlank(this.layout().length);
  }

  addCard(id: string, index?: number): string | null {
    if (!ROSTER_INDEX.has(id)) return null;
    const key = this.nextKey();
    const at = index ?? this.layout().length;
    this.commit(() => {
      const layout = [...this.layout()];
      layout.splice(Math.max(0, Math.min(at, layout.length)), 0, { key, id });
      this.layout.set(layout);
      this.sort.set('custom');
      const hidden = new Set(this.hidden());
      if (hidden.delete(id)) this.hidden.set(hidden);
    });
    return key;
  }

  duplicateAt(index: number): string | null {
    const entry = this.layout()[index];
    if (!entry?.id) return null;
    return this.addCard(entry.id, index + 1);
  }

  padToPageEnd(index: number): void {
    const size = this.pageSize();
    const offset = index % size;
    if (offset === 0) return;
    const count = size - offset;
    this.commit(() => {
      const blanks = Array.from({ length: count }, () => ({
        key: this.nextKey(),
        id: null,
      }));
      const layout = [...this.layout()];
      layout.splice(index, 0, ...blanks);
      this.layout.set(layout);
      this.sort.set('custom');
    });
  }

  removeAt(index: number): void {
    const entry = this.layout()[index];
    if (!entry) return;
    this.commit(() => {
      const layout = [...this.layout()];
      layout.splice(index, 1);
      this.layout.set(layout);

      const owned = new Set(this.owned());
      if (owned.delete(entry.key)) this.owned.set(owned);

      if (entry.id && !layout.some((other) => other.id === entry.id)) {
        this.hidden.set(new Set(this.hidden()).add(entry.id));
      }
    });
  }

  removeBlanks(): void {
    if (!this.layout().some((entry) => entry.id === null)) return;
    this.commit(() => {
      this.layout.set(this.layout().filter((entry) => entry.id !== null));
    });
  }

  restore(id: string): void {
    if (!this.hidden().has(id)) return;
    this.commit(() => {
      const hidden = new Set(this.hidden());
      hidden.delete(id);
      this.hidden.set(hidden);
      this.layout.set(
        this.reconcile(this.layout(), hidden, this.sort(), this.showCosmetic()),
      );
    });
  }

  restoreAll(): void {
    if (!this.hidden().size) return;
    this.commit(() => {
      const hidden: ReadonlySet<string> = new Set();
      this.hidden.set(hidden);
      this.layout.set(
        this.reconcile(this.layout(), hidden, this.sort(), this.showCosmetic()),
      );
    });
  }

  resetLayout(): void {
    this.commit(() => {
      this.hidden.set(new Set());
      this.sort.set('dex');
      this.owned.set(new Set());
      this.layout.set(this.freshLayout(this.showCosmetic()));
    });
  }

  clearOwned(): void {
    if (!this.owned().size) return;
    this.commit(() => this.owned.set(new Set()));
  }

  exportJson(): string {
    return JSON.stringify(
      { version: 2, activeId: this.activeId(), binders: this.allDocs() },
      null,
      2,
    );
  }

  importJson(raw: string): boolean {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }

    const record = parsed as Partial<Persisted> & LegacyPersisted;
    let docs: BinderDoc[];
    if (Array.isArray(record.binders) && record.binders.length) {
      docs = record.binders.map((doc) => this.normalizeDoc(doc));
    } else if (Array.isArray(record.layout)) {
      docs = [this.migrateLegacy(record)];
    } else {
      return false;
    }

    this.inactive.clear();
    for (const doc of docs) this.inactive.set(doc.id, doc);
    this.binders.set(
      docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        cards: doc.layout.filter((entry) => entry.id).length,
      })),
    );

    const activeId = docs.some((doc) => doc.id === record.activeId)
      ? record.activeId!
      : docs[0].id;
    this.loadDoc(activeId);
    this.syncSummaries();
    this.persist();
    return true;
  }

  findMatches(term: string): number[] {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    const normalized = needle.replace(/[^a-z0-9]/g, '');
    const slots = this.slots().filter((slot) => slot.card);

    const asNumber = Number(needle.replace(/^#/, ''));
    if (Number.isInteger(asNumber) && asNumber > 0) {
      const byNum = slots.filter((slot) => slot.card!.num === asNumber);
      if (byNum.length) return byNum.map((slot) => slot.index);
    }

    const exact: number[] = [];
    const partial: number[] = [];
    for (const slot of slots) {
      const card = slot.card!;
      const name = card.name.toLowerCase();
      if (name === needle || card.id === normalized) {
        exact.push(slot.index);
      } else if (
        name.includes(needle) ||
        (normalized.length > 0 && card.id.includes(normalized))
      ) {
        partial.push(slot.index);
      }
    }
    return [...exact, ...partial];
  }

  findIndex(term: string): number {
    return this.findMatches(term)[0] ?? -1;
  }

  findCards(term: string, limit = 8): BinderCard[] {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    const normalized = needle.replace(/[^a-z0-9]/g, '');
    const showCosmetic = this.showCosmetic();
    const pool = ROSTER.filter(
      (card) => showCosmetic || card.kind !== 'cosmetic',
    );

    const asNumber = Number(needle.replace(/^#/, ''));
    if (Number.isInteger(asNumber) && asNumber > 0) {
      return pool.filter((card) => card.num === asNumber).slice(0, limit);
    }

    const exact = pool.find((card) => card.name.toLowerCase() === needle);
    const partial = pool.filter(
      (card) =>
        card.name.toLowerCase().includes(needle) ||
        (normalized.length > 0 && card.id.includes(normalized)),
    );
    const ordered = exact
      ? [exact, ...partial.filter((card) => card.id !== exact.id)]
      : partial;
    return ordered.slice(0, limit);
  }
}

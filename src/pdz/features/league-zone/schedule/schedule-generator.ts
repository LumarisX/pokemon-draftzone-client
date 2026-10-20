import {
  BracketSlotFlex,
  FlexBracketMatch,
} from './bracket.model';
import { ScheduleStageType } from './schedule.model';

type Slot =
  | { t: 'seed'; seed: number }
  | { t: 'bye' }
  | { t: 'winner'; from: string }
  | { t: 'loser'; from: string };

interface Template {
  key: string;
  a: Slot;
  b: Slot;
  label?: string;
  depth?: number;
}

export interface StageOptions {
  playTwice?: boolean;
  thirdPlace?: boolean;
  grandFinalReset?: boolean;
}

const W = (from: string): Slot => ({ t: 'winner', from });
const L = (from: string): Slot => ({ t: 'loser', from });

function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const sum = order.length * 2 + 1;
    order = order.flatMap((seed) => [seed, sum - seed]);
  }
  return order;
}

function roundRobin(n: number, twice: boolean): Template[] {
  const ids = Array.from({ length: n }, (_, i) => i + 1);
  if (n % 2) ids.push(0);
  const size = ids.length;
  let row = ids.slice();
  const rounds: [number, number][][] = [];
  for (let r = 0; r < size - 1; r++) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < size / 2; i++) {
      const a = row[i];
      const b = row[size - 1 - i];
      if (a && b) pairs.push(r % 2 && i === 0 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    row = [row[0], row[size - 1], ...row.slice(1, size - 1)];
  }
  if (twice) rounds.push(...rounds.map((pairs) => pairs.map(([a, b]): [number, number] => [b, a])));
  return rounds.flatMap((pairs, r) =>
    pairs.map(([a, b], i) => ({
      key: `rr${r + 1}-${i}`,
      depth: r + 1,
      a: { t: 'seed', seed: a } as Slot,
      b: { t: 'seed', seed: b } as Slot,
    })),
  );
}

function upperBracket(n: number): { out: Template[]; rounds: string[][] } {
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, n)));
  const order = seedOrder(size);
  const entrant = (seed: number): Slot =>
    seed <= n ? { t: 'seed', seed } : { t: 'bye' };
  const out: Template[] = [];
  const rounds: string[][] = [];
  let previous: string[] = [];
  for (let i = 0; i < size / 2; i++) {
    const key = `w1-${i}`;
    out.push({ key, a: entrant(order[2 * i]), b: entrant(order[2 * i + 1]) });
    previous.push(key);
  }
  rounds.push(previous);
  for (let r = 2; previous.length > 1; r++) {
    const next: string[] = [];
    for (let i = 0; i < previous.length / 2; i++) {
      const key = `w${r}-${i}`;
      out.push({ key, a: W(previous[2 * i]), b: W(previous[2 * i + 1]) });
      next.push(key);
    }
    rounds.push(next);
    previous = next;
  }
  return { out, rounds };
}

interface Pending {
  slot: Slot;
  ready: number;
}

function lowerLevel(
  level: number,
  incoming: Pending[],
): { out: Template[]; drops: Pending[]; champion: Slot } {
  const out: Template[] = [];
  const drops: Pending[] = [];
  const queue = incoming.slice().sort((a, b) => a.ready - b.ready);
  let survivors: Pending[] = [];
  let waiting: Pending[] = [];
  let next = 0;

  const play = (a: Pending, b: Pending, depth: number): Pending => {
    const key = `x${level}-${out.length}`;
    out.push({ key, a: a.slot, b: b.slot });
    drops.push({ slot: L(key), ready: depth });
    return { slot: W(key), ready: depth };
  };
  const pairUp = (list: Pending[], depth: number) => {
    const won: Pending[] = [];
    for (let i = 0; i + 1 < list.length; i += 2)
      won.push(play(list[i], list[i + 1], depth));
    return { won, left: list.length % 2 ? [list[list.length - 1]] : [] };
  };

  for (let depth = 1; depth < 512; depth++) {
    while (next < queue.length && queue[next].ready < depth)
      waiting.push(queue[next++]);
    const more = next < queue.length;
    if (!more && survivors.length + waiting.length === 1)
      return { out, drops, champion: (survivors[0] ?? waiting[0]).slot };
    if (survivors.length + waiting.length < 2) continue;

    if (survivors.length && survivors.length === waiting.length) {
      const order = level % 2 ? waiting.slice().reverse() : waiting;
      survivors = survivors.map((s, i) => play(s, order[i], depth));
      waiting = [];
    } else if (survivors.length >= waiting.length) {
      const result = pairUp(survivors, depth);
      survivors = [...result.left, ...result.won];
    } else {
      const result = pairUp(waiting, depth);
      waiting = result.left;
      survivors = [...survivors, ...result.won];
    }
  }
  return { out, drops, champion: (survivors[0] ?? waiting[0]).slot };
}

function elimination(n: number, lives: number, options: StageOptions): Template[] {
  const { out, rounds } = upperBracket(n);
  const champions: Slot[] = [W(rounds[rounds.length - 1][0])];
  let drops: Pending[] = rounds.flatMap((keys, r) =>
    keys.map((key) => ({ slot: L(key), ready: r + 1 })),
  );
  for (let level = 1; level < lives; level++) {
    const result = lowerLevel(level, drops);
    out.push(...result.out);
    champions.push(result.champion);
    drops = result.drops;
  }
  if (lives === 1 && options.thirdPlace && rounds.length >= 2) {
    const semis = rounds[rounds.length - 2];
    out.push({ key: 'third', label: 'Third Place', a: L(semis[0]), b: L(semis[1]) });
  }
  let current = champions[lives - 1];
  for (let k = lives - 2; k >= 0; k--) {
    const key = k === 0 ? 'gf' : `gq${k}`;
    out.push({
      key,
      label: k === 0 ? 'Grand Final' : 'Grand Final Qualifier',
      a: champions[k],
      b: current,
    });
    current = W(key);
  }
  if (lives > 1 && options.grandFinalReset)
    out.push({ key: 'gf2', label: 'Grand Final Reset', a: W('gf'), b: L('gf') });
  return collapseByes(out);
}

function collapseByes(templates: Template[]): Template[] {
  let list = templates.map((t) => ({ ...t }));
  const isBye = (slot: Slot) => slot.t === 'bye';
  for (;;) {
    const match = list.find((t) => isBye(t.a) || isBye(t.b));
    if (!match) break;
    const through: Slot =
      isBye(match.a) && isBye(match.b) ? { t: 'bye' } : isBye(match.a) ? match.b : match.a;
    list = list.filter((t) => t !== match);
    for (const other of list) {
      for (const side of ['a', 'b'] as const) {
        const slot = other[side];
        if ((slot.t !== 'winner' && slot.t !== 'loser') || slot.from !== match.key)
          continue;
        other[side] = slot.t === 'winner' ? through : { t: 'bye' };
      }
    }
  }

  const byKey = new Map(list.map((t) => [t.key, t]));
  const depth = new Map<string, number>();
  const depthOf = (t: Template): number => {
    const known = depth.get(t.key);
    if (known !== undefined) return known;
    const from = (slot: Slot) =>
      (slot.t === 'winner' || slot.t === 'loser') && byKey.has(slot.from)
        ? depthOf(byKey.get(slot.from)!)
        : 0;
    const value = 1 + Math.max(from(t.a), from(t.b));
    depth.set(t.key, value);
    return value;
  };
  return list.map((t) => ({ ...t, depth: depthOf(t) }));
}

export function minimumEntrants(type: ScheduleStageType): number {
  switch (type) {
    case 'single-elimination':
      return 2;
    case 'double-elimination':
      return 3;
    case 'triple-elimination':
      return 4;
    case 'custom':
      return 0;
    default:
      return 2;
  }
}

export function generateStage(
  type: ScheduleStageType,
  entrantCount: number,
  options: StageOptions = {},
): Template[] {
  if (entrantCount < Math.max(2, minimumEntrants(type))) return [];
  switch (type) {
    case 'round-robin':
    case 'swiss':
      return roundRobin(entrantCount, !!options.playTwice);
    case 'single-elimination':
      return elimination(entrantCount, 1, options);
    case 'double-elimination':
      return elimination(entrantCount, 2, options);
    case 'triple-elimination':
      return elimination(entrantCount, 3, options);
    default:
      return [];
  }
}

export function stageWeeks(templates: Template[]): number {
  return templates.reduce((max, t) => Math.max(max, t.depth ?? 1), 0);
}

function toSlot(slot: Slot, prefix: string): BracketSlotFlex {
  switch (slot.t) {
    case 'seed':
      return { type: 'seed', seed: slot.seed };
    case 'winner':
      return { type: 'winner', from: `${prefix}:${slot.from}` };
    case 'loser':
      return { type: 'loser', from: `${prefix}:${slot.from}` };
    default:
      return { type: 'empty' };
  }
}

export function placeStage(
  templates: Template[],
  stageKey: string,
  startRound: number,
): FlexBracketMatch[] {
  const prefix = `${stageKey}:${Date.now().toString(36)}`;
  const positions = new Map<number, number>();
  return templates
    .slice()
    .sort((a, b) => (a.depth ?? 1) - (b.depth ?? 1))
    .map((t) => {
      const round = startRound + (t.depth ?? 1) - 1;
      const position = positions.get(round) ?? 0;
      positions.set(round, position + 1);
      return {
        id: `${prefix}:${t.key}`,
        section: stageKey,
        round,
        position,
        a: toSlot(t.a, prefix),
        b: toSlot(t.b, prefix),
        ...(t.label ? { label: t.label } : {}),
      };
    });
}

export type StageTemplate = Template;

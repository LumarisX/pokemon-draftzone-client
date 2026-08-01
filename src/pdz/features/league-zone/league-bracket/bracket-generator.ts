import {
  BracketRoundMeta,
  BracketSlotFlex,
  FlexBracketMatch,
  FlexBracketSectionConfig,
} from './bracket.model';

export interface GeneratedBracket {
  matches: FlexBracketMatch[];
  sections: FlexBracketSectionConfig[];
}

export interface DoubleEliminationOptions {
  grandFinalsReset?: boolean;
}

export function standardSeedOrder(size: number): number[] {
  if (size < 1 || (size & (size - 1)) !== 0) {
    throw new Error(`Bracket size must be a power of 2, got ${size}`);
  }
  let order = [1];
  while (order.length < size) {
    const sum = order.length * 2 + 1;
    order = order.flatMap((seed) => [seed, sum - seed]);
  }
  return order;
}

function nextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function assertTeamCount(teamCount: number): void {
  if (!Number.isInteger(teamCount) || teamCount < 2) {
    throw new Error(`Team count must be an integer >= 2, got ${teamCount}`);
  }
}

function seedSlot(seed: number, teamCount: number): BracketSlotFlex {
  return seed <= teamCount ? { type: 'seed', seed } : { type: 'bye', seed };
}

const winnerOf = (from: string): BracketSlotFlex => ({ type: 'winner', from });
const loserOf = (from: string): BracketSlotFlex => ({ type: 'loser', from });

function buildWinnersMatches(
  teamCount: number,
  section: string,
): FlexBracketMatch[] {
  const size = nextPowerOfTwo(teamCount);
  const roundCount = Math.log2(size);
  const order = standardSeedOrder(size);
  const matches: FlexBracketMatch[] = [];

  for (let round = 0; round < roundCount; round++) {
    const matchCount = size >> (round + 1);
    for (let i = 0; i < matchCount; i++) {
      matches.push({
        id: `w${round + 1}-${i}`,
        section,
        round,
        position: i,
        a:
          round === 0
            ? seedSlot(order[2 * i], teamCount)
            : winnerOf(`w${round}-${2 * i}`),
        b:
          round === 0
            ? seedSlot(order[2 * i + 1], teamCount)
            : winnerOf(`w${round}-${2 * i + 1}`),
      });
    }
  }
  return matches;
}

function compactByes(matches: FlexBracketMatch[]): FlexBracketMatch[] {
  const result = [...matches];

  const replaceRef = (
    slot: BracketSlotFlex,
    id: string,
    winnerRepl: BracketSlotFlex,
    loserRepl: BracketSlotFlex,
  ): BracketSlotFlex => {
    if (slot.type === 'winner' && slot.from === id) return winnerRepl;
    if (slot.type === 'loser' && slot.from === id) return loserRepl;
    return slot;
  };

  for (;;) {
    const idx = result.findIndex(
      (m) => m.a.type === 'bye' || m.b.type === 'bye',
    );
    if (idx === -1) break;

    const match = result[idx];
    const aBye = match.a.type === 'bye';
    const bBye = match.b.type === 'bye';
    const winnerRepl = aBye && bBye ? match.a : aBye ? match.b : match.a;
    const loserRepl = aBye ? match.a : match.b;

    result.splice(idx, 1);
    for (const other of result) {
      other.a = replaceRef(other.a, match.id, winnerRepl, loserRepl);
      other.b = replaceRef(other.b, match.id, winnerRepl, loserRepl);
    }
  }
  return result;
}

export function generateSingleElimination(teamCount: number): GeneratedBracket {
  assertTeamCount(teamCount);
  return {
    matches: compactByes(buildWinnersMatches(teamCount, 'main')),
    sections: [{ key: 'main', kind: 'main', teamCount }],
  };
}

export function generateDoubleElimination(
  teamCount: number,
  options?: DoubleEliminationOptions,
): GeneratedBracket {
  assertTeamCount(teamCount);
  const includeReset = options?.grandFinalsReset ?? true;

  const size = nextPowerOfTwo(teamCount);
  const winnersRounds = Math.log2(size);
  const matches = buildWinnersMatches(teamCount, 'winners');

  for (let j = 1; j <= winnersRounds - 1; j++) {
    const matchCount = size >> (j + 1);
    const minor = 2 * j - 1;
    const major = 2 * j;

    for (let i = 0; i < matchCount; i++) {
      matches.push({
        id: `l${minor}-${i}`,
        section: 'losers',
        round: minor - 1,
        position: i,
        a:
          j === 1 ? loserOf(`w1-${2 * i}`) : winnerOf(`l${minor - 1}-${2 * i}`),
        b:
          j === 1
            ? loserOf(`w1-${2 * i + 1}`)
            : winnerOf(`l${minor - 1}-${2 * i + 1}`),
      });
    }
    for (let i = 0; i < matchCount; i++) {
      const dropIndex = j % 2 === 1 ? matchCount - 1 - i : i;
      matches.push({
        id: `l${major}-${i}`,
        section: 'losers',
        round: major - 1,
        position: i,
        a: winnerOf(`l${minor}-${i}`),
        b: loserOf(`w${j + 1}-${dropIndex}`),
      });
    }
  }

  matches.push({
    id: 'gf',
    section: 'finals',
    round: 0,
    position: 0,
    a: winnerOf(`w${winnersRounds}-0`),
    b:
      winnersRounds === 1
        ? loserOf('w1-0')
        : winnerOf(`l${2 * (winnersRounds - 1)}-0`),
    label: 'Grand Finals',
  });

  if (includeReset) {
    matches.push({
      id: 'gf-reset',
      section: 'finals',
      round: 1,
      position: 0,
      a: winnerOf('gf'),
      b: loserOf('gf'),
      label: 'Bracket Reset (if necessary)',
    });
  }

  return {
    // The losers and finals sections are numbered from 0 above, as if each ran
    // on its own axis. On the stage's shared axis they have to sit after the
    // winners rounds that feed them, which the wiring already says.
    matches: assignGlobalRounds(compactByes(matches)),
    sections: [
      {
        key: 'winners',
        kind: 'winners',
        title: 'Winners Bracket',
        order: 0,
        teamCount,
      },
      {
        key: 'losers',
        kind: 'losers',
        title: 'Losers Bracket',
        order: 1,
        teamCount,
      },
      {
        key: 'finals',
        kind: 'finals',
        title: 'Grand Finals',
        order: 2,
        teamCount,
      },
    ],
  };
}

/** Rounds in one full round-robin cycle (everyone plays everyone once). */
export function fullRoundRobinCycle(teamCount: number): number {
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
}

/**
 * Round-robin schedule via the circle method: seed 1 stays fixed while the
 * rest rotate one step per round, so no pairing repeats until every team has
 * played every other team (then the cycle repeats in the same order). Odd
 * fields get a phantom seed whose "opponent" simply sits the round out.
 */
export function generateRoundRobin(
  teamCount: number,
  rounds: number,
): GeneratedBracket {
  assertTeamCount(teamCount);
  if (!Number.isInteger(rounds) || rounds < 1) {
    throw new Error(`Round count must be an integer >= 1, got ${rounds}`);
  }

  const size = teamCount % 2 === 0 ? teamCount : teamCount + 1;
  let rotation = Array.from({ length: size - 1 }, (_, i) => i + 2);
  const matches: FlexBracketMatch[] = [];

  for (let round = 0; round < rounds; round++) {
    const row = [1, ...rotation];
    let position = 0;
    for (let i = 0; i < size / 2; i++) {
      const a = row[i];
      const b = row[size - 1 - i];
      if (a > teamCount || b > teamCount) continue; // phantom seed = bye round
      matches.push({
        id: `rr${round + 1}-${position}`,
        section: 'rr',
        round,
        position,
        a: { type: 'seed', seed: a },
        b: { type: 'seed', seed: b },
      });
      position++;
    }
    rotation = [rotation[rotation.length - 1], ...rotation.slice(0, -1)];
  }

  return {
    matches,
    sections: [{ key: 'rr', kind: 'round-robin', title: '', teamCount }],
  };
}

// ─── Composing several generated blocks into one bracket ─────────────────────

export interface OffsetOptions {
  /** Prepended to every match id and section key so blocks never collide. */
  prefix: string;
  /** Added to every seed number, mapping block-local seeds onto global ones. */
  seedOffset: number;
  /**
   * Added to every round, placing the block further down the stage's global
   * round axis — a playoff bracket that starts after a group stage has run.
   */
  roundOffset?: number;
  /** Section title. Applied to the block's first section only; the rest keep theirs. */
  title?: string;
  /** Starting `order` for this block's sections. */
  orderBase?: number;
}

/**
 * Rewrites a freshly generated block so it can sit alongside others in one
 * bracket: ids and section keys are namespaced, and block-local seeds 1..n
 * become global seeds `seedOffset+1 .. seedOffset+n`.
 *
 * Titles survive the key rename because sections carry `kind` — the layout and
 * the payload builder read that, not the key.
 */
export function offsetBracket(
  bracket: GeneratedBracket,
  options: OffsetOptions,
): GeneratedBracket {
  const { prefix, seedOffset, roundOffset = 0, title, orderBase = 0 } = options;
  const id = (raw: string) => `${prefix}--${raw}`;
  const sectionKey = (raw: string) => `${prefix}--${raw}`;

  const shift = (slot: BracketSlotFlex): BracketSlotFlex => {
    switch (slot.type) {
      case 'seed':
      case 'bye':
        return { type: slot.type, seed: slot.seed + seedOffset };
      case 'winner':
      case 'loser':
        return { type: slot.type, from: id(slot.from) };
      default:
        return slot;
    }
  };

  return {
    matches: bracket.matches.map((match) => ({
      ...match,
      id: id(match.id),
      section: sectionKey(match.section ?? 'main'),
      round: match.round + roundOffset,
      a: shift(match.a),
      b: shift(match.b),
    })),
    sections: bracket.sections.map((section, idx) => ({
      ...section,
      key: sectionKey(section.key),
      kind: section.kind ?? (section.key as FlexBracketSectionConfig['kind']),
      label: title,
      // The block's name prefixes each section title so the canvas reads
      // "Playoffs — Losers Bracket" rather than a bare namespaced key.
      title: title
        ? section.title
          ? `${title} — ${section.title}`
          : title
        : section.title,
      order: orderBase + (section.order ?? idx),
      // Keyed by global round, so they move with the block.
      ...(section.roundTitles
        ? {
            roundTitles: Object.fromEntries(
              Object.entries(section.roundTitles).map(([rn, t]) => [
                Number(rn) + roundOffset,
                t,
              ]),
            ),
          }
        : {}),
    })),
  };
}

// ─── Global round axis ────────────────────────────────────────────────────────

/**
 * Places every match on the stage's global round axis.
 *
 * Each generator numbers its own block's rounds from 0, which is right for a
 * block in isolation but wrong once blocks share one schedule: a losers-bracket
 * round 1 cannot run in the same week as the winners round 1 that feeds it. The
 * global round is therefore derived from the wiring — a match sits one round
 * past the latest match it consumes — with its own round number as a floor, so
 * an unwired block (a round robin, where nothing feeds anything) keeps the
 * spacing its generator gave it.
 *
 * Cycles are left alone rather than throwing; `validateBracketWiring` is what
 * reports them, and this must stay safe to call on a half-wired draft.
 */
export function assignGlobalRounds(
  matches: FlexBracketMatch[],
): FlexBracketMatch[] {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const resolved = new Map<string, number>();
  const visiting = new Set<string>();

  const roundOf = (match: FlexBracketMatch): number => {
    const cached = resolved.get(match.id);
    if (cached !== undefined) return cached;
    // A cycle would recurse forever; fall back to the authored round and let
    // validation surface the real problem.
    if (visiting.has(match.id)) return match.round;
    visiting.add(match.id);

    let round = match.round;
    for (const slot of [match.a, match.b]) {
      if (slot.type !== 'winner' && slot.type !== 'loser') continue;
      const source = byId.get(slot.from);
      if (!source) continue;
      round = Math.max(round, roundOf(source) + 1);
    }

    visiting.delete(match.id);
    resolved.set(match.id, round);
    return round;
  };

  return matches.map((m) => {
    const round = roundOf(m);
    return round === m.round ? m : { ...m, round };
  });
}

/** Global rounds a section occupies, ascending. */
function sectionRounds(
  matches: FlexBracketMatch[],
  sectionKey: string,
): number[] {
  return [
    ...new Set(
      matches
        .filter((m) => (m.section ?? 'main') === sectionKey)
        .map((m) => m.round),
    ),
  ].sort((a, b) => a - b);
}

// ─── Server payload ───────────────────────────────────────────────────────────

export interface BracketPayloadMatch {
  key: string;
  roundIndex: number;
  section?: string;
  bracketRound?: number;
  position?: number;
  label?: string;
  a: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
  b: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
}

export interface BracketPayloadSection {
  key: string;
  title?: string;
  kind?: string;
  label?: string;
  order?: number;
  teamCount?: number;
  roundTitles?: Record<number, string>;
}

export interface BracketPayload {
  rounds: BracketRoundMeta[];
  sections: BracketPayloadSection[];
  matches: BracketPayloadMatch[];
}

function roundName(
  kind: string,
  roundIdx: number,
  roundCount: number,
): string {
  const isLast = roundIdx === roundCount - 1;
  const isSecondToLast = roundIdx === roundCount - 2;
  switch (kind) {
    case 'main':
      if (isLast) return 'Finals';
      if (isSecondToLast) return 'Semi-Finals';
      return `Round ${roundIdx + 1}`;
    case 'winners':
      if (isLast) return 'Winners Finals';
      if (isSecondToLast) return 'Winners Semi-Finals';
      return `Winners Round ${roundIdx + 1}`;
    case 'losers':
      if (isLast) return 'Losers Finals';
      if (isSecondToLast) return 'Losers Semi-Finals';
      return `Losers Round ${roundIdx + 1}`;
    case 'finals':
      return roundIdx === 0 ? 'Grand Finals' : 'Bracket Reset';
    case 'rr':
    case 'round-robin':
      return `Round ${roundIdx + 1}`;
    default:
      return `${kind} Round ${roundIdx + 1}`;
  }
}

/**
 * Flattens a bracket into the server's bracket DTO shape.
 *
 * The rounds list is the stage's global round axis, one entry per row, and a
 * match's `roundIndex` is simply its global round — sections no longer each
 * contribute their own rounds. Pass `authoredRounds` to keep the organizer's
 * names and deadlines; without it, names are synthesized from whichever
 * sections occupy each row.
 */
export function toBracketPayload(
  bracket: GeneratedBracket,
  authoredRounds?: BracketRoundMeta[],
): BracketPayload {
  // A match may sit in a section that was never configured (added by hand on
  // the builder), so the union — not just the config list — is what counts.
  const configByKey = new Map(bracket.sections.map((s) => [s.key, s]));
  const orderOf = (key: string) =>
    configByKey.get(key)?.order ?? 1000 + [...configByKey.keys()].length;
  const sectionKeys = [
    ...new Set([
      ...bracket.sections.map((s) => s.key),
      ...bracket.matches.map((m) => m.section ?? 'main'),
    ]),
  ].sort((a, b) => orderOf(a) - orderOf(b));

  const roundCount = bracket.matches.reduce(
    (max, m) => Math.max(max, m.round + 1),
    0,
  );

  /**
   * Auto name for a row: when exactly one section occupies it, that section's
   * own naming still applies ("Winners Semi-Finals"). When several do, no one
   * section owns the row, so it gets a plain number.
   */
  const synthesizeRoundName = (globalRound: number): string => {
    const occupants = sectionKeys.filter((key) =>
      bracket.matches.some(
        (m) => (m.section ?? 'main') === key && m.round === globalRound,
      ),
    );
    const override = occupants
      .map((key) => configByKey.get(key)?.roundTitles?.[globalRound])
      .find((title): title is string => !!title);
    if (override) return override;
    if (occupants.length !== 1) return `Round ${globalRound + 1}`;

    const key = occupants[0];
    const cfg = configByKey.get(key);
    const rounds = sectionRounds(bracket.matches, key);
    const auto = roundName(
      cfg?.kind ?? key,
      rounds.indexOf(globalRound),
      rounds.length,
    );
    return cfg?.label ? `${cfg.label} — ${auto}` : auto;
  };

  const rounds: BracketRoundMeta[] = Array.from(
    { length: roundCount },
    (_, i) => authoredRounds?.[i] ?? { name: synthesizeRoundName(i) },
  );

  // `bracketRound` stays section-relative for readers that still expect a
  // per-section column index; it is derived, never authored.
  const sectionStart = new Map(
    sectionKeys.map((key) => {
      const rounds = sectionRounds(bracket.matches, key);
      return [key, rounds.length ? rounds[0] : 0] as const;
    }),
  );

  const matches: BracketPayloadMatch[] = bracket.matches.map((m) => {
    const toSlot = (slot: BracketSlotFlex) => {
      if (slot.type === 'winner' || slot.type === 'loser')
        return { type: slot.type, from: slot.from };
      if (slot.type === 'seed' || slot.type === 'bye')
        return { type: 'seed' as const, seed: slot.seed };
      throw new Error(
        `Cannot build payload: match "${m.id}" has an unassigned slot`,
      );
    };
    const section = m.section ?? 'main';
    return {
      key: m.id,
      roundIndex: m.round,
      section: m.section,
      bracketRound: m.round - (sectionStart.get(section) ?? 0),
      position: m.position,
      label: m.label,
      a: toSlot(m.a),
      b: toSlot(m.b),
    };
  });

  const sections: BracketPayloadSection[] = sectionKeys.map((key, idx) => {
    const cfg = configByKey.get(key);
    return {
      key,
      title: cfg?.title,
      kind: cfg?.kind,
      label: cfg?.label,
      order: cfg?.order ?? idx,
      teamCount: cfg?.teamCount,
      roundTitles: cfg?.roundTitles,
    };
  });

  return { rounds, sections, matches };
}

// ─── Custom bracket editing (add/delete/move/rewire matches) ─────────────────

let customIdCounter = 0;

/** Generates a unique match id for organizer-created matches, distinct from generator ids (w1-0, l2-1, gf, ...). */
export function nextCustomMatchId(): string {
  customIdCounter += 1;
  return `custom-${Date.now().toString(36)}-${customIdCounter}`;
}

function matchesInGroup(
  matches: FlexBracketMatch[],
  section: string,
  round: number,
): FlexBracketMatch[] {
  return matches
    .filter((m) => (m.section ?? 'main') === section && m.round === round)
    .sort((a, b) => a.position - b.position);
}

/** Appends a blank (fully unassigned) match to the given section/round, positioned last. */
export function addMatchToRound(
  matches: FlexBracketMatch[],
  section: string,
  round: number,
): FlexBracketMatch[] {
  const position = matchesInGroup(matches, section, round).length;
  const match: FlexBracketMatch = {
    id: nextCustomMatchId(),
    section,
    round,
    position,
    a: { type: 'empty' },
    b: { type: 'empty' },
  };
  return [...matches, match];
}

/**
 * Removes a match and clears any slot elsewhere that referenced it (winner/loser
 * of a deleted match becomes unassigned rather than leaving a dangling reference).
 */
export function deleteMatch(
  matches: FlexBracketMatch[],
  matchId: string,
): FlexBracketMatch[] {
  const clearRef = (slot: BracketSlotFlex): BracketSlotFlex =>
    (slot.type === 'winner' || slot.type === 'loser') && slot.from === matchId
      ? { type: 'empty' }
      : slot;

  return matches
    .filter((m) => m.id !== matchId)
    .map((m) => ({ ...m, a: clearRef(m.a), b: clearRef(m.b) }));
}

/**
 * Moves a match to a (possibly different) section/round at `toIndex`, and
 * renumbers `position` sequentially within both the source and destination
 * groups. Slot references (winner/loser `from`) are untouched — they target
 * match ids, not positions, so they stay valid across the move.
 */
export function moveMatch(
  matches: FlexBracketMatch[],
  matchId: string,
  toSection: string,
  toRound: number,
  toIndex: number,
): FlexBracketMatch[] {
  const moving = matches.find((m) => m.id === matchId);
  if (!moving) return matches;

  const fromSection = moving.section ?? 'main';
  const fromRound = moving.round;
  const sameGroup = fromSection === toSection && fromRound === toRound;

  const destSiblings = matchesInGroup(matches, toSection, toRound).filter(
    (m) => m.id !== matchId,
  );
  const clampedIndex = Math.max(0, Math.min(toIndex, destSiblings.length));
  destSiblings.splice(clampedIndex, 0, moving);

  const destPositionById = new Map(
    destSiblings.map((m, idx) => [m.id, idx]),
  );

  let sourcePositionById = new Map<string, number>();
  if (!sameGroup) {
    const sourceSiblings = matchesInGroup(matches, fromSection, fromRound).filter(
      (m) => m.id !== matchId,
    );
    sourcePositionById = new Map(sourceSiblings.map((m, idx) => [m.id, idx]));
  }

  return matches.map((m) => {
    if (m.id === matchId) {
      return { ...m, section: toSection, round: toRound, position: clampedIndex };
    }
    if (destPositionById.has(m.id)) {
      return { ...m, position: destPositionById.get(m.id)! };
    }
    if (sourcePositionById.has(m.id)) {
      return { ...m, position: sourcePositionById.get(m.id)! };
    }
    return m;
  });
}

/** Immutably replaces slot A or B of a single match. */
export function setMatchSlot(
  matches: FlexBracketMatch[],
  matchId: string,
  slotIndex: 0 | 1,
  slot: BracketSlotFlex,
): FlexBracketMatch[] {
  return matches.map((m) =>
    m.id === matchId ? { ...m, [slotIndex === 0 ? 'a' : 'b']: slot } : m,
  );
}

/**
 * `sections` is only needed to police seed reuse: a knockout section may use a
 * seed once, but a round-robin section replays the same teams every round.
 */
export function validateBracketWiring(
  matches: FlexBracketMatch[],
  sections?: FlexBracketSectionConfig[],
): string[] {
  const errors: string[] = [];
  const byId = new Map<string, FlexBracketMatch>();
  const kindByKey = new Map(
    (sections ?? []).map((s) => [s.key, s.kind ?? s.key]),
  );

  for (const match of matches) {
    if (byId.has(match.id)) errors.push(`Duplicate match id "${match.id}"`);
    byId.set(match.id, match);
  }

  const consumed = new Set<string>();
  const seenSeeds = new Set<string>();
  for (const match of matches) {
    const section = match.section ?? 'main';
    const kind = kindByKey.get(section) ?? section;
    for (const [slotIndex, slot] of [match.a, match.b].entries()) {
      if (slot.type === 'empty') {
        errors.push(
          `Match "${match.id}" has an unassigned slot ${slotIndex === 0 ? 'A' : 'B'}`,
        );
        continue;
      }
      if (slot.type === 'seed' || slot.type === 'bye') {
        // In a knockout section a team enters once and advances by reference;
        // a round-robin section deliberately re-uses every seed each round.
        if (kind === 'round-robin' || kind === 'rr') continue;
        const key = `${section}:${slot.seed}`;
        if (seenSeeds.has(key)) {
          errors.push(
            `Seed ${slot.seed} enters "${section}" more than once (match "${match.id}")`,
          );
        }
        seenSeeds.add(key);
        continue;
      }
      if (slot.type !== 'winner' && slot.type !== 'loser') continue;
      if (slot.from === match.id) {
        errors.push(`Match "${match.id}" references itself`);
        continue;
      }
      if (!byId.has(slot.from)) {
        errors.push(
          `Match "${match.id}" references missing match "${slot.from}"`,
        );
        continue;
      }
      const edge = `${slot.type}:${slot.from}`;
      if (consumed.has(edge)) {
        errors.push(`${slot.type} of "${slot.from}" is used more than once`);
      }
      consumed.add(edge);
    }
  }

  // Cycle detection via iterative DFS over input edges.
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 'done') return false;
    if (state.get(id) === 'visiting') return true;
    state.set(id, 'visiting');
    const match = byId.get(id);
    if (match) {
      for (const slot of [match.a, match.b]) {
        if (
          (slot.type === 'winner' || slot.type === 'loser') &&
          byId.has(slot.from) &&
          visit(slot.from)
        ) {
          return true;
        }
      }
    }
    state.set(id, 'done');
    return false;
  };
  for (const match of matches) {
    if (visit(match.id)) {
      errors.push(`Cycle detected involving match "${match.id}"`);
      break;
    }
  }

  return errors;
}

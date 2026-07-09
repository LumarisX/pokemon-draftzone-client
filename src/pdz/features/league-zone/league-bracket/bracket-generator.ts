import {
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
    sections: [{ key: 'main' }],
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
    matches: compactByes(matches),
    sections: [
      { key: 'winners', title: 'Winners Bracket', order: 0 },
      { key: 'losers', title: 'Losers Bracket', order: 1 },
      { key: 'finals', title: 'Grand Finals', order: 2 },
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
    sections: [{ key: 'rr', title: '' }],
  };
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

export interface BracketPayload {
  rounds: { name: string }[];
  matches: BracketPayloadMatch[];
}

function roundName(
  sectionKey: string,
  roundIdx: number,
  roundCount: number,
): string {
  const isLast = roundIdx === roundCount - 1;
  switch (sectionKey) {
    case 'main':
      return isLast ? 'Finals' : `Round ${roundIdx + 1}`;
    case 'winners':
      return isLast ? 'Winners Finals' : `Winners Round ${roundIdx + 1}`;
    case 'losers':
      return isLast ? 'Losers Finals' : `Losers Round ${roundIdx + 1}`;
    case 'finals':
      return roundIdx === 0 ? 'Grand Finals' : 'Bracket Reset';
    case 'rr':
      return `Round ${roundIdx + 1}`;
    default:
      return `${sectionKey} Round ${roundIdx + 1}`;
  }
}

/**
 * Flattens a generated bracket into the server's generate-bracket DTO shape:
 * one flat, ordered rounds list (sections in display order, rounds within
 * them) and matches carrying an index into it.
 */
export function toBracketPayload(bracket: GeneratedBracket): BracketPayload {
  const sectionKeys = bracket.sections.map((s) => s.key);
  const rounds: { name: string }[] = [];
  const roundIndexBySectionRound = new Map<string, number>();

  for (const sectionKey of sectionKeys) {
    const roundNums = [
      ...new Set(
        bracket.matches
          .filter((m) => (m.section ?? 'main') === sectionKey)
          .map((m) => m.round),
      ),
    ].sort((a, b) => a - b);
    roundNums.forEach((rn, idx) => {
      roundIndexBySectionRound.set(`${sectionKey}:${rn}`, rounds.length);
      rounds.push({ name: roundName(sectionKey, idx, roundNums.length) });
    });
  }

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
    return {
      key: m.id,
      roundIndex: roundIndexBySectionRound.get(
        `${m.section ?? 'main'}:${m.round}`,
      )!,
      section: m.section,
      bracketRound: m.round,
      position: m.position,
      label: m.label,
      a: toSlot(m.a),
      b: toSlot(m.b),
    };
  });

  return { rounds, matches };
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

export function validateBracketWiring(matches: FlexBracketMatch[]): string[] {
  const errors: string[] = [];
  const byId = new Map<string, FlexBracketMatch>();

  for (const match of matches) {
    if (byId.has(match.id)) errors.push(`Duplicate match id "${match.id}"`);
    byId.set(match.id, match);
  }

  const consumed = new Set<string>();
  for (const match of matches) {
    for (const [slotIndex, slot] of [match.a, match.b].entries()) {
      if (slot.type === 'empty') {
        errors.push(
          `Match "${match.id}" has an unassigned slot ${slotIndex === 0 ? 'A' : 'B'}`,
        );
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

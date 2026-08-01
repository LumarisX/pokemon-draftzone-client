import {
  addMatchToRound,
  assignGlobalRounds,
  deleteMatch,
  fullRoundRobinCycle,
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  moveMatch,
  offsetBracket,
  setMatchSlot,
  standardSeedOrder,
  toBracketPayload,
  validateBracketWiring,
} from './bracket-generator';
import { FlexBracketMatch } from './bracket.model';

const byId = (matches: FlexBracketMatch[], id: string): FlexBracketMatch => {
  const match = matches.find((m) => m.id === id);
  if (!match) throw new Error(`Expected match "${id}" to exist`);
  return match;
};

const hasByeSlots = (matches: FlexBracketMatch[]): boolean =>
  matches.some((m) => m.a.type === 'bye' || m.b.type === 'bye');

describe('standardSeedOrder', () => {
  it('produces the standard placement for common sizes', () => {
    expect(standardSeedOrder(1)).toEqual([1]);
    expect(standardSeedOrder(2)).toEqual([1, 2]);
    expect(standardSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(standardSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(standardSeedOrder(16)).toEqual([
      1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11,
    ]);
  });

  it('rejects non-power-of-2 sizes', () => {
    expect(() => standardSeedOrder(6)).toThrow();
    expect(() => standardSeedOrder(0)).toThrow();
  });
});

describe('generateSingleElimination', () => {
  it('builds a full 8-team bracket', () => {
    const { matches, sections } = generateSingleElimination(8);

    expect(sections).toEqual([{ key: 'main', kind: 'main', teamCount: 8 }]);
    expect(matches.length).toBe(7);
    expect(matches.filter((m) => m.round === 0).length).toBe(4);
    expect(matches.filter((m) => m.round === 1).length).toBe(2);
    expect(matches.filter((m) => m.round === 2).length).toBe(1);

    expect(byId(matches, 'w1-0').a).toEqual({ type: 'seed', seed: 1 });
    expect(byId(matches, 'w1-0').b).toEqual({ type: 'seed', seed: 8 });
    expect(byId(matches, 'w1-1').a).toEqual({ type: 'seed', seed: 4 });
    expect(byId(matches, 'w1-1').b).toEqual({ type: 'seed', seed: 5 });

    expect(byId(matches, 'w3-0').a).toEqual({ type: 'winner', from: 'w2-0' });
    expect(byId(matches, 'w3-0').b).toEqual({ type: 'winner', from: 'w2-1' });

    expect(validateBracketWiring(matches)).toEqual([]);
  });

  it('compacts byes for a 6-team bracket, advancing top seeds directly', () => {
    const { matches } = generateSingleElimination(6);

    expect(matches.length).toBe(5);
    expect(hasByeSlots(matches)).toBe(false);

    // Seeds 7 and 8 are byes, so seeds 1 and 2 skip straight to round 2.
    expect(matches.find((m) => m.id === 'w1-0')).toBeUndefined();
    expect(matches.find((m) => m.id === 'w1-2')).toBeUndefined();
    expect(byId(matches, 'w2-0').a).toEqual({ type: 'seed', seed: 1 });
    expect(byId(matches, 'w2-0').b).toEqual({ type: 'winner', from: 'w1-1' });
    expect(byId(matches, 'w2-1').a).toEqual({ type: 'seed', seed: 2 });
    expect(byId(matches, 'w2-1').b).toEqual({ type: 'winner', from: 'w1-3' });

    expect(validateBracketWiring(matches)).toEqual([]);
  });

  it('handles the minimum 2-team bracket', () => {
    const { matches } = generateSingleElimination(2);
    expect(matches.length).toBe(1);
    expect(byId(matches, 'w1-0').a).toEqual({ type: 'seed', seed: 1 });
    expect(byId(matches, 'w1-0').b).toEqual({ type: 'seed', seed: 2 });
  });

  it('rejects invalid team counts', () => {
    expect(() => generateSingleElimination(1)).toThrow();
    expect(() => generateSingleElimination(4.5)).toThrow();
  });
});

describe('generateDoubleElimination', () => {
  it('builds a full 8-team double elimination bracket', () => {
    const { matches, sections } = generateDoubleElimination(8);

    expect(sections.map((s) => s.key)).toEqual(['winners', 'losers', 'finals']);
    // 2N-2 real matches plus the reset.
    expect(matches.length).toBe(15);

    // First losers round pairs adjacent winners-round-1 losers.
    expect(byId(matches, 'l1-0').a).toEqual({ type: 'loser', from: 'w1-0' });
    expect(byId(matches, 'l1-0').b).toEqual({ type: 'loser', from: 'w1-1' });

    // Winners-round-2 losers drop in reversed order (anti-rematch).
    expect(byId(matches, 'l2-0').a).toEqual({ type: 'winner', from: 'l1-0' });
    expect(byId(matches, 'l2-0').b).toEqual({ type: 'loser', from: 'w2-1' });
    expect(byId(matches, 'l2-1').b).toEqual({ type: 'loser', from: 'w2-0' });

    expect(byId(matches, 'l3-0').a).toEqual({ type: 'winner', from: 'l2-0' });
    expect(byId(matches, 'l3-0').b).toEqual({ type: 'winner', from: 'l2-1' });
    expect(byId(matches, 'l4-0').a).toEqual({ type: 'winner', from: 'l3-0' });
    expect(byId(matches, 'l4-0').b).toEqual({ type: 'loser', from: 'w3-0' });

    const gf = byId(matches, 'gf');
    expect(gf.a).toEqual({ type: 'winner', from: 'w3-0' });
    expect(gf.b).toEqual({ type: 'winner', from: 'l4-0' });
    expect(gf.section).toBe('finals');

    const reset = byId(matches, 'gf-reset');
    expect(reset.a).toEqual({ type: 'winner', from: 'gf' });
    expect(reset.b).toEqual({ type: 'loser', from: 'gf' });

    expect(validateBracketWiring(matches)).toEqual([]);
  });

  it('omits the reset match when disabled', () => {
    const { matches } = generateDoubleElimination(8, {
      grandFinalsReset: false,
    });
    expect(matches.length).toBe(14);
    expect(matches.find((m) => m.id === 'gf-reset')).toBeUndefined();
  });

  it('compacts byes for a 3-team bracket', () => {
    const { matches } = generateDoubleElimination(3, {
      grandFinalsReset: false,
    });

    expect(matches.map((m) => m.id).sort()).toEqual([
      'gf',
      'l2-0',
      'w1-1',
      'w2-0',
    ]);
    expect(hasByeSlots(matches)).toBe(false);

    expect(byId(matches, 'w2-0').a).toEqual({ type: 'seed', seed: 1 });
    expect(byId(matches, 'w2-0').b).toEqual({ type: 'winner', from: 'w1-1' });
    // The only losers match: loser of the 2v3 opener vs loser of the final.
    expect(byId(matches, 'l2-0').a).toEqual({ type: 'loser', from: 'w1-1' });
    expect(byId(matches, 'l2-0').b).toEqual({ type: 'loser', from: 'w2-0' });

    expect(validateBracketWiring(matches)).toEqual([]);
  });

  it('handles a 2-team bracket as opener plus grand finals', () => {
    const { matches } = generateDoubleElimination(2);

    expect(matches.map((m) => m.id).sort()).toEqual([
      'gf',
      'gf-reset',
      'w1-0',
    ]);
    expect(byId(matches, 'gf').a).toEqual({ type: 'winner', from: 'w1-0' });
    expect(byId(matches, 'gf').b).toEqual({ type: 'loser', from: 'w1-0' });
  });

  it('produces valid, fully-compacted brackets of the expected size for any field', () => {
    for (let teamCount = 2; teamCount <= 33; teamCount++) {
      const single = generateSingleElimination(teamCount);
      expect(single.matches.length).toBe(teamCount - 1);
      expect(hasByeSlots(single.matches)).toBe(false);
      expect(validateBracketWiring(single.matches)).toEqual([]);

      const double = generateDoubleElimination(teamCount, {
        grandFinalsReset: false,
      });
      expect(double.matches.length).toBe(2 * teamCount - 2);
      expect(hasByeSlots(double.matches)).toBe(false);
      expect(validateBracketWiring(double.matches)).toEqual([]);
    }
  });

  it('routes every team through the losers bracket exactly once at most', () => {
    // Every match's loser must be consumed by exactly one downstream slot,
    // except losers-bracket and finals matches where a loss eliminates.
    const { matches } = generateDoubleElimination(16, {
      grandFinalsReset: false,
    });
    const loserRefs = new Set(
      matches
        .flatMap((m) => [m.a, m.b])
        .filter((s) => s.type === 'loser')
        .map((s) => (s as { from: string }).from),
    );
    for (const match of matches) {
      if (match.section === 'winners') {
        expect(loserRefs.has(match.id)).toBe(true);
      }
      if (match.section === 'losers') {
        expect(loserRefs.has(match.id)).toBe(false);
      }
    }
  });
});

describe('generateRoundRobin', () => {
  const pairingsOf = (matches: FlexBracketMatch[], round?: number): string[] =>
    matches
      .filter((m) => round === undefined || m.round === round)
      .map((m) => {
        const a = (m.a as { seed: number }).seed;
        const b = (m.b as { seed: number }).seed;
        return [Math.min(a, b), Math.max(a, b)].join('v');
      });

  it('plays every pair exactly once over a full cycle (even field)', () => {
    const { matches, sections } = generateRoundRobin(6, fullRoundRobinCycle(6));

    expect(sections).toEqual([
      { key: 'rr', kind: 'round-robin', title: '', teamCount: 6 },
    ]);
    expect(matches.length).toBe(15); // C(6,2)
    for (let r = 0; r < 5; r++) {
      expect(matches.filter((m) => m.round === r).length).toBe(3);
    }
    expect(new Set(pairingsOf(matches)).size).toBe(15);
    expect(validateBracketWiring(matches)).toEqual([]);
  });

  it('gives each team exactly one bye per cycle with an odd field', () => {
    const { matches } = generateRoundRobin(5, fullRoundRobinCycle(5));

    expect(matches.length).toBe(10); // C(5,2)
    const byeTeams: number[] = [];
    for (let r = 0; r < 5; r++) {
      const roundMatches = matches.filter((m) => m.round === r);
      expect(roundMatches.length).toBe(2);
      const playing = new Set(
        roundMatches.flatMap((m) => [
          (m.a as { seed: number }).seed,
          (m.b as { seed: number }).seed,
        ]),
      );
      for (let seed = 1; seed <= 5; seed++) {
        if (!playing.has(seed)) byeTeams.push(seed);
      }
    }
    expect([...byeTeams].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(pairingsOf(matches)).size).toBe(10);
  });

  it('never repeats a pairing until everyone has played everyone else', () => {
    const cycle = fullRoundRobinCycle(8);
    const { matches } = generateRoundRobin(8, 3 * cycle);

    // Within every full-cycle window, all 28 pairings are distinct.
    for (let start = 0; start + cycle <= 3 * cycle; start += cycle) {
      const window = matches.filter(
        (m) => m.round >= start && m.round < start + cycle,
      );
      expect(new Set(pairingsOf(window)).size).toBe(28);
    }
    expect(validateBracketWiring(matches)).toEqual([]);
  });

  it('supports a partial schedule with fewer rounds than a full cycle', () => {
    const { matches } = generateRoundRobin(6, 3);
    expect(matches.length).toBe(9);
    expect(Math.max(...matches.map((m) => m.round))).toBe(2);
    expect(new Set(pairingsOf(matches)).size).toBe(9);
  });

  it('rejects invalid inputs', () => {
    expect(() => generateRoundRobin(1, 3)).toThrow();
    expect(() => generateRoundRobin(6, 0)).toThrow();
    expect(() => generateRoundRobin(6, 2.5)).toThrow();
  });
});

describe('validateBracketWiring', () => {
  const seed = (n: number) => ({ type: 'seed', seed: n }) as const;

  it('flags duplicate ids, missing refs, self-refs, and reused edges', () => {
    const errors = validateBracketWiring([
      { id: 'm1', round: 0, position: 0, a: seed(1), b: seed(2) },
      {
        id: 'm1',
        round: 0,
        position: 1,
        a: { type: 'winner', from: 'nope' },
        b: { type: 'winner', from: 'm2' },
      },
      {
        id: 'm2',
        round: 1,
        position: 0,
        a: { type: 'winner', from: 'm2' },
        b: seed(3),
      },
    ]);
    expect(errors.some((e) => e.includes('Duplicate match id'))).toBe(true);
    expect(errors.some((e) => e.includes('missing match "nope"'))).toBe(true);
    expect(errors.some((e) => e.includes('references itself'))).toBe(true);
  });

  it('flags cycles', () => {
    const errors = validateBracketWiring([
      {
        id: 'a',
        round: 0,
        position: 0,
        a: { type: 'winner', from: 'b' },
        b: seed(1),
      },
      {
        id: 'b',
        round: 1,
        position: 0,
        a: { type: 'winner', from: 'a' },
        b: seed(2),
      },
    ]);
    expect(errors.some((e) => e.includes('Cycle detected'))).toBe(true);
  });

  it('flags unassigned (empty) slots', () => {
    const errors = validateBracketWiring([
      { id: 'm1', round: 0, position: 0, a: seed(1), b: { type: 'empty' } },
    ]);
    expect(errors.some((e) => e.includes('unassigned slot B'))).toBe(true);
  });
});

describe('custom bracket editing helpers', () => {
  const seed = (n: number) => ({ type: 'seed', seed: n }) as const;

  describe('addMatchToRound', () => {
    it('appends a blank match positioned last within its section/round', () => {
      const base: FlexBracketMatch[] = [
        { id: 'm1', section: 'main', round: 0, position: 0, a: seed(1), b: seed(2) },
      ];
      const result = addMatchToRound(base, 'main', 0);
      expect(result.length).toBe(2);
      const added = result[1];
      expect(added.section).toBe('main');
      expect(added.round).toBe(0);
      expect(added.position).toBe(1);
      expect(added.a).toEqual({ type: 'empty' });
      expect(added.b).toEqual({ type: 'empty' });

      // Starting a brand-new round/section starts at position 0.
      const secondSection = addMatchToRound(base, 'losers', 0);
      expect(secondSection[1].position).toBe(0);
    });
  });

  describe('deleteMatch', () => {
    it('removes the match and clears dangling winner/loser references', () => {
      const base: FlexBracketMatch[] = [
        { id: 'm1', section: 'main', round: 0, position: 0, a: seed(1), b: seed(2) },
        {
          id: 'm2',
          section: 'main',
          round: 1,
          position: 0,
          a: { type: 'winner', from: 'm1' },
          b: seed(3),
        },
      ];
      const result = deleteMatch(base, 'm1');
      expect(result.map((m) => m.id)).toEqual(['m2']);
      expect(result[0].a).toEqual({ type: 'empty' });
    });
  });

  describe('moveMatch', () => {
    it('reorders within the same round without disturbing other groups', () => {
      const base: FlexBracketMatch[] = [
        { id: 'm1', section: 'main', round: 0, position: 0, a: seed(1), b: seed(2) },
        { id: 'm2', section: 'main', round: 0, position: 1, a: seed(3), b: seed(4) },
        { id: 'm3', section: 'main', round: 1, position: 0, a: seed(5), b: seed(6) },
      ];
      const result = moveMatch(base, 'm1', 'main', 0, 1);
      const byId = (id: string) => result.find((m) => m.id === id)!;
      expect(byId('m1').position).toBe(1);
      expect(byId('m2').position).toBe(0);
      expect(byId('m3').position).toBe(0);
      expect(byId('m3').round).toBe(1);
    });

    it('moves a match across rounds/sections and renumbers both groups', () => {
      const base: FlexBracketMatch[] = [
        { id: 'm1', section: 'winners', round: 0, position: 0, a: seed(1), b: seed(2) },
        { id: 'm2', section: 'winners', round: 0, position: 1, a: seed(3), b: seed(4) },
        { id: 'm3', section: 'losers', round: 0, position: 0, a: seed(5), b: seed(6) },
      ];
      const result = moveMatch(base, 'm1', 'losers', 0, 1);
      const byId = (id: string) => result.find((m) => m.id === id)!;

      expect(byId('m1').section).toBe('losers');
      expect(byId('m1').round).toBe(0);
      expect(byId('m1').position).toBe(1);

      // Source group (winners round 0) closes the gap left behind.
      expect(byId('m2').position).toBe(0);

      // Destination group keeps the existing match first, moved match after it.
      expect(byId('m3').position).toBe(0);
    });

    it('is a no-op when the match id does not exist', () => {
      const base: FlexBracketMatch[] = [
        { id: 'm1', section: 'main', round: 0, position: 0, a: seed(1), b: seed(2) },
      ];
      expect(moveMatch(base, 'missing', 'main', 0, 0)).toEqual(base);
    });
  });

  describe('setMatchSlot', () => {
    it('immutably replaces the requested slot only', () => {
      const base: FlexBracketMatch[] = [
        { id: 'm1', section: 'main', round: 0, position: 0, a: seed(1), b: seed(2) },
      ];
      const result = setMatchSlot(base, 'm1', 1, { type: 'winner', from: 'm0' });
      expect(result[0].a).toEqual(seed(1));
      expect(result[0].b).toEqual({ type: 'winner', from: 'm0' });
      expect(base[0].b).toEqual(seed(2));
    });
  });
});

describe('offsetBracket', () => {
  it('namespaces ids and section keys so two blocks never collide', () => {
    const a = offsetBracket(generateSingleElimination(4), {
      prefix: 'groups',
      seedOffset: 0,
      title: 'Groups',
    });
    const b = offsetBracket(generateSingleElimination(4), {
      prefix: 'playoffs',
      seedOffset: 4,
      title: 'Playoffs',
    });

    const ids = [...a.matches, ...b.matches].map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^(groups|playoffs)--/.test(id))).toBe(true);

    const keys = [...a.sections, ...b.sections].map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('shifts seeds onto the block\'s slice of the global numbering', () => {
    const block = offsetBracket(generateSingleElimination(4), {
      prefix: 'playoffs',
      seedOffset: 8,
      title: 'Playoffs',
    });

    const seeds = block.matches
      .flatMap((m) => [m.a, m.b])
      .filter((slot) => slot.type === 'seed' || slot.type === 'bye')
      .map((slot) => (slot as { seed: number }).seed)
      .sort((x, y) => x - y);
    expect(seeds).toEqual([9, 10, 11, 12]);
  });

  it('rewrites winner/loser references to the namespaced ids', () => {
    const block = offsetBracket(generateDoubleElimination(4), {
      prefix: 'p',
      seedOffset: 0,
      title: 'Playoffs',
    });
    const ids = new Set(block.matches.map((m) => m.id));

    for (const match of block.matches) {
      for (const slot of [match.a, match.b]) {
        if (slot.type === 'winner' || slot.type === 'loser') {
          expect(ids.has(slot.from)).toBe(true);
        }
      }
    }
    // Wiring survives the rename intact.
    expect(validateBracketWiring(block.matches)).toEqual([]);
  });

  it('keeps the structural kind so titles survive the key rename', () => {
    const block = offsetBracket(generateDoubleElimination(4), {
      prefix: 'p',
      seedOffset: 0,
      title: 'Playoffs',
    });
    expect(block.sections.map((s) => s.kind)).toEqual([
      'winners',
      'losers',
      'finals',
    ]);
    expect(block.sections.map((s) => s.title)).toEqual([
      'Playoffs — Winners Bracket',
      'Playoffs — Losers Bracket',
      'Playoffs — Grand Finals',
    ]);
  });
});

describe('assignGlobalRounds', () => {
  const match = (
    id: string,
    round: number,
    inputs: string[] = [],
  ): FlexBracketMatch => ({
    id,
    round,
    position: 0,
    a: inputs[0]
      ? { type: 'winner', from: inputs[0] }
      : { type: 'seed', seed: 1 },
    b: inputs[1]
      ? { type: 'winner', from: inputs[1] }
      : { type: 'seed', seed: 2 },
  });

  it('pushes a match past every match it consumes', () => {
    const placed = assignGlobalRounds([
      match('final', 0, ['semi-a', 'semi-b']),
      match('semi-a', 0),
      match('semi-b', 0),
    ]);
    expect(byId(placed, 'semi-a').round).toBe(0);
    expect(byId(placed, 'final').round).toBe(1);
  });

  it('leaves an unwired block on the rounds its generator gave it', () => {
    // A round robin has no winner/loser edges at all — nothing may collapse.
    const rr = generateRoundRobin(4, 3);
    const placed = assignGlobalRounds(rr.matches);
    expect(placed.map((m) => m.round)).toEqual(rr.matches.map((m) => m.round));
  });

  it('staggers a double-elimination losers bracket behind the winners', () => {
    const { matches } = generateDoubleElimination(8, {
      grandFinalsReset: false,
    });
    const roundOf = (id: string) => byId(matches, id).round;
    // Losers round 1 consumes the losers of winners round 1, so it cannot
    // share that row — it has to sit one round later.
    expect(roundOf('l1-0')).toBeGreaterThan(roundOf('w1-0'));
    // The grand final is last of all.
    const maxRound = Math.max(...matches.map((m) => m.round));
    expect(roundOf('gf')).toBe(maxRound);
  });

  it('never places a match before one of its inputs', () => {
    const { matches } = generateDoubleElimination(16);
    const roundById = new Map(matches.map((m) => [m.id, m.round]));
    for (const m of matches) {
      for (const slot of [m.a, m.b]) {
        if (slot.type !== 'winner' && slot.type !== 'loser') continue;
        expect(m.round).toBeGreaterThan(roundById.get(slot.from)!);
      }
    }
  });

  it('returns the authored rounds rather than hanging on a cycle', () => {
    const cyclic: FlexBracketMatch[] = [
      match('x', 2, ['y']),
      match('y', 1, ['x']),
    ];
    const placed = assignGlobalRounds(cyclic);
    expect(placed.length).toBe(2);
    expect(placed.every((m) => Number.isFinite(m.round))).toBe(true);
  });
});

describe('toBracketPayload with composed sections', () => {
  /** Groups in round 0, playoffs in rounds 1-2 — blocks share one round axis. */
  const composed = () => {
    const a = offsetBracket(generateRoundRobin(4, 1), {
      prefix: 'groups',
      seedOffset: 0,
      title: 'Groups',
      orderBase: 0,
    });
    const b = offsetBracket(generateSingleElimination(4), {
      prefix: 'playoffs',
      seedOffset: 4,
      roundOffset: 1,
      title: 'Playoffs',
      orderBase: 1,
    });
    return {
      matches: [...a.matches, ...b.matches],
      sections: [...a.sections, ...b.sections],
    };
  };

  it('names rounds from the section kind, prefixed by the block', () => {
    const payload = toBracketPayload(composed());
    // Playoffs is single-elim (kind "main"), so its last round is the Finals —
    // the namespaced key would otherwise have fallen through to a generic name.
    expect(payload.rounds.map((r) => r.name)).toContain('Playoffs — Finals');
    expect(payload.rounds.map((r) => r.name)).toContain('Groups — Round 1');
  });

  it('emits one round per row of the global axis, not per section', () => {
    const payload = toBracketPayload(composed());
    // Groups round 0, playoffs rounds 1 and 2 — three rows, not "1 + 2 blocks".
    expect(payload.rounds.length).toBe(3);
    const groupsRounds = payload.matches
      .filter((m) => m.section === 'groups--rr')
      .map((m) => m.roundIndex);
    expect([...new Set(groupsRounds)]).toEqual([0]);
  });

  it('numbers a row generically when several sections share it', () => {
    // No roundOffset: both blocks start at round 0, so row 0 belongs to
    // neither section and cannot take either one's name.
    const a = offsetBracket(generateRoundRobin(4, 1), {
      prefix: 'groups',
      seedOffset: 0,
      title: 'Groups',
    });
    const b = offsetBracket(generateSingleElimination(4), {
      prefix: 'playoffs',
      seedOffset: 4,
      title: 'Playoffs',
      orderBase: 1,
    });
    const payload = toBracketPayload({
      matches: [...a.matches, ...b.matches],
      sections: [...a.sections, ...b.sections],
    });
    expect(payload.rounds[0].name).toBe('Round 1');
    // Row 1 is playoffs alone, so it keeps the block's own naming.
    expect(payload.rounds[1].name).toBe('Playoffs — Finals');
  });

  it('keeps organizer-authored round names and deadlines', () => {
    const authored = [
      { name: 'Week 1', matchDeadline: '2026-08-07T00:00:00.000Z' },
      { name: 'Week 2', matchDeadline: null, bestOf: 3 },
      { name: 'Championship', matchDeadline: null },
    ];
    const payload = toBracketPayload(composed(), authored);
    expect(payload.rounds).toEqual(authored);
  });

  it('reports bracketRound relative to the section start', () => {
    const payload = toBracketPayload(composed());
    const finals = payload.matches.find((m) => m.roundIndex === 2)!;
    // Global round 2, but the playoffs section began at global round 1.
    expect(finals.section).toBe('playoffs--main');
    expect(finals.bracketRound).toBe(1);
  });

  it('gives every match a valid index into the flat round list', () => {
    const payload = toBracketPayload(composed());
    for (const match of payload.matches) {
      expect(match.roundIndex).toBeGreaterThanOrEqual(0);
      expect(match.roundIndex).toBeLessThan(payload.rounds.length);
    }
  });

  it('emits section metadata for every section holding matches', () => {
    const payload = toBracketPayload(composed());
    const keys = payload.sections.map((s) => s.key);
    expect(keys).toEqual(['groups--rr', 'playoffs--main']);
    expect(payload.sections.map((s) => s.teamCount)).toEqual([4, 4]);
    expect(payload.sections.map((s) => s.label)).toEqual([
      'Groups',
      'Playoffs',
    ]);
  });
});

describe('validateBracketWiring seed reuse', () => {
  it('accepts a round-robin section replaying its seeds', () => {
    const { matches, sections } = generateRoundRobin(4, 3);
    expect(validateBracketWiring(matches, sections)).toEqual([]);
  });

  it('accepts a round-robin section that has been namespaced', () => {
    const block = offsetBracket(generateRoundRobin(4, 3), {
      prefix: 'groups',
      seedOffset: 0,
      title: 'Groups',
    });
    expect(validateBracketWiring(block.matches, block.sections)).toEqual([]);
  });

  it('flags a seed used twice inside one knockout section', () => {
    const { matches, sections } = generateSingleElimination(4);
    const doubled = matches.map((m) =>
      m.id === 'w1-1' ? { ...m, a: { type: 'seed' as const, seed: 1 } } : m,
    );
    expect(validateBracketWiring(doubled, sections).join(' ')).toContain(
      'Seed 1 enters "main" more than once',
    );
  });

  it('allows the same seed in two different sections', () => {
    const a = offsetBracket(generateSingleElimination(2), {
      prefix: 'groups',
      seedOffset: 0,
      title: 'Groups',
    });
    const b = offsetBracket(generateSingleElimination(2), {
      prefix: 'playoffs',
      seedOffset: 0,
      title: 'Playoffs',
    });
    expect(
      validateBracketWiring(
        [...a.matches, ...b.matches],
        [...a.sections, ...b.sections],
      ),
    ).toEqual([]);
  });
});

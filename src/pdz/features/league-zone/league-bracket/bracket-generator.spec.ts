import {
  addMatchToRound,
  deleteMatch,
  fullRoundRobinCycle,
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  moveMatch,
  setMatchSlot,
  standardSeedOrder,
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

    expect(sections).toEqual([{ key: 'main' }]);
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

    expect(sections).toEqual([{ key: 'rr', title: '' }]);
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

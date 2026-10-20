import {
  generateStage,
  placeStage,
  StageTemplate,
  stageWeeks,
} from './schedule-generator';
import { ScheduleStageType } from './schedule.model';

function play(templates: StageTemplate[], n: number, pick: () => boolean) {
  const result = new Map<string, { w: number; l: number }>();
  const losses = new Array(n + 1).fill(0);
  const booked = new Set<string>();
  const problems: string[] = [];
  const who = (slot: StageTemplate['a']): number => {
    if (slot.t === 'seed') return slot.seed;
    if (slot.t === 'winner') return result.get(slot.from)!.w;
    if (slot.t === 'loser') return result.get(slot.from)!.l;
    return 0;
  };
  for (const match of templates.slice().sort((a, b) => a.depth! - b.depth!)) {
    const a = who(match.a);
    const b = who(match.b);
    for (const team of [a, b]) {
      const slot = `${team}@${match.depth}`;
      if (booked.has(slot)) problems.push(`double-booked ${slot}`);
      booked.add(slot);
    }
    const aWins = pick();
    result.set(match.key, { w: aWins ? a : b, l: aWins ? b : a });
    losses[aWins ? b : a]++;
  }
  return { losses: losses.slice(1), problems };
}

describe('generateStage', () => {
  it('plays everyone once in a round robin', () => {
    const matches = generateStage('round-robin', 8);
    expect(matches).toHaveLength(28);
    expect(stageWeeks(matches)).toBe(7);
  });

  it('doubles the weeks when each pair meets twice', () => {
    const matches = generateStage('round-robin', 6, { playTwice: true });
    expect(matches).toHaveLength(30);
    expect(stageWeeks(matches)).toBe(10);
  });

  it.each([
    ['single-elimination', 8, 7, 3],
    ['double-elimination', 8, 14, 6],
    ['triple-elimination', 8, 20, 9],
  ] as [ScheduleStageType, number, number, number][])(
    'builds a %s bracket for %i entrants',
    (type, n, matches, weeks) => {
      const templates = generateStage(type, n);
      expect(templates).toHaveLength(matches);
      expect(stageWeeks(templates)).toBe(weeks);
    },
  );

  it('adds a third-place match only to single elimination', () => {
    expect(
      generateStage('single-elimination', 8, { thirdPlace: true }).map(
        (m) => m.label,
      ),
    ).toContain('Third Place');
    expect(
      generateStage('double-elimination', 8, { thirdPlace: true }).some(
        (m) => m.label === 'Third Place',
      ),
    ).toBe(false);
  });

  it('adds a grand final reset to double elimination', () => {
    expect(
      generateStage('double-elimination', 8, { grandFinalReset: true }),
    ).toHaveLength(15);
  });

  it.each([1, 2, 3])(
    'never books a team twice or plays one past its losses (%i lives)',
    (lives) => {
      const type = (
        ['single-elimination', 'double-elimination', 'triple-elimination'] as const
      )[lives - 1];
      let seed = 7;
      const pick = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280 < 0.5;
      };
      for (let n = lives + 1; n <= 16; n++) {
        const templates = generateStage(type, n);
        const keys = new Set(templates.map((m) => m.key));
        for (const match of templates)
          for (const slot of [match.a, match.b]) {
            if (slot.t === 'winner' || slot.t === 'loser')
              expect(keys.has(slot.from)).toBe(true);
            expect(slot.t).not.toBe('bye');
          }
        for (let trial = 0; trial < 25; trial++) {
          const { losses, problems } = play(templates, n, pick);
          expect(problems).toEqual([]);
          expect(losses.every((l) => l <= lives)).toBe(true);
          const alive = losses.filter((l) => l < lives).length;
          expect(alive).toBeGreaterThanOrEqual(1);
          expect(alive).toBeLessThanOrEqual(lives);
        }
      }
    },
  );

  it('needs enough entrants for the format', () => {
    expect(generateStage('triple-elimination', 3)).toEqual([]);
    expect(generateStage('custom', 8)).toEqual([]);
  });
});

describe('placeStage', () => {
  it('places each match in its week from the start round and wires ids', () => {
    const matches = placeStage(generateStage('single-elimination', 4), 'po', 5);
    expect(matches.map((m) => m.round)).toEqual([5, 5, 6]);
    expect(matches.every((m) => m.section === 'po')).toBe(true);
    const final = matches[2];
    expect(final.a).toEqual({ type: 'winner', from: matches[0].id });
    expect(final.b).toEqual({ type: 'winner', from: matches[1].id });
  });
});

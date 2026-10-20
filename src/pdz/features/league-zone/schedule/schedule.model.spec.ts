import { FlexBracketMatch } from './bracket.model';
import {
  addMatchToRound,
  deleteMatch,
  moveMatch,
  removeStage,
  slotFromValue,
  slotValue,
} from './schedule-edits';
import { generateStage, placeStage } from './schedule-generator';
import { validateSchedule } from './schedule-validate';
import {
  ScheduleDraft,
  ScheduleStage,
  bracketGroups,
  defaultStartRound,
  insertRound,
  matchLabels,
  ordinal,
  removeRound,
  shiftStage,
  stageLanes,
  trimAutoRounds,
  padRounds,
} from './schedule.model';

const seed = (n: number) => ({ type: 'seed', seed: n }) as const;

function stage(key: string, overrides: Partial<ScheduleStage> = {}): ScheduleStage {
  return {
    key,
    name: key,
    type: 'round-robin',
    public: true,
    entrants: [1, 2, 3, 4].map((n) => ({ kind: 'team', teamId: `${key}${n}` })),
    random: false,
    drawn: true,
    storesEntrants: false,
    entrantsChanged: false,
    ...overrides,
  };
}

function draftOf(stages: ScheduleStage[], matches: FlexBracketMatch[]): ScheduleDraft {
  return padRounds({ rounds: [], stages, matches });
}

describe('schedule model', () => {
  it('writes ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st',
    ]);
  });

  it('stacks stages that overlap in time into separate lanes', () => {
    const draft = draftOf(
      [stage('a'), stage('b'), stage('c')],
      [
        { id: 'a1', section: 'a', round: 0, position: 0, a: seed(1), b: seed(2) },
        { id: 'a2', section: 'a', round: 3, position: 0, a: seed(1), b: seed(2) },
        { id: 'b1', section: 'b', round: 1, position: 0, a: seed(1), b: seed(2) },
        { id: 'c1', section: 'c', round: 5, position: 0, a: seed(1), b: seed(2) },
      ],
    );
    const { lanes, count } = stageLanes(draft);
    expect(count).toBe(2);
    expect(lanes.get('a')).toBe(0);
    expect(lanes.get('b')).toBe(1);
    expect(lanes.get('c')).toBe(0);
    expect(defaultStartRound(draft)).toBe(6);
  });

  it('numbers matches per stage in week order', () => {
    const draft = draftOf(
      [stage('a')],
      [
        { id: 'late', section: 'a', round: 1, position: 0, a: seed(1), b: seed(2) },
        { id: 'early', section: 'a', round: 0, position: 0, a: seed(3), b: seed(4) },
        { id: 'final', section: 'a', round: 2, position: 0, a: seed(1), b: seed(3), label: 'Final' },
      ],
    );
    const labels = matchLabels(draft);
    expect(labels.get('early')).toBe('Match 1');
    expect(labels.get('late')).toBe('Match 2');
    expect(labels.get('final')).toBe('Final');
  });

  it('splits a triple elimination bracket into its four groups', () => {
    const matches = placeStage(generateStage('triple-elimination', 8), 'po', 0);
    const groups = [...bracketGroups(matches).values()];
    for (const group of ['upper', 'lower', 'last', 'final'])
      expect(groups).toContain(group);
    const finals = matches.filter((m) => bracketGroups(matches).get(m.id) === 'final');
    expect(finals.map((m) => m.label)).toEqual(['Grand Final Qualifier', 'Grand Final']);
  });

  it('inserts and removes weeks, shifting later matches', () => {
    const draft = draftOf(
      [stage('a')],
      [{ id: 'm', section: 'a', round: 1, position: 0, a: seed(1), b: seed(2) }],
    );
    const inserted = insertRound(draft, 0);
    expect(inserted.rounds).toHaveLength(3);
    expect(inserted.matches[0].round).toBe(2);
    expect(removeRound(inserted, 2)).toBe(inserted);
    expect(removeRound(inserted, 0).matches[0].round).toBe(1);
  });

  it('moves a whole stage to start in another week', () => {
    const draft = draftOf(
      [stage('a')],
      [
        { id: 'm1', section: 'a', round: 0, position: 0, a: seed(1), b: seed(2) },
        { id: 'm2', section: 'a', round: 1, position: 0, a: seed(3), b: seed(4) },
      ],
    );
    const moved = shiftStage(draft, 'a', 4);
    expect(moved.matches.map((m) => m.round)).toEqual([4, 5]);
    expect(moved.rounds).toHaveLength(6);
    expect(trimAutoRounds(shiftStage(moved, 'a', 0)).rounds).toHaveLength(2);
  });
});

describe('schedule edits', () => {
  it('appends a blank match last in its week', () => {
    const base: FlexBracketMatch[] = [
      { id: 'm1', section: 'a', round: 0, position: 0, a: seed(1), b: seed(2) },
    ];
    const [, added] = addMatchToRound(base, 'a', 0);
    expect(added.position).toBe(1);
    expect(added.a).toEqual({ type: 'empty' });
    expect(addMatchToRound(base, 'b', 0)[1].position).toBe(0);
  });

  it('clears references to a deleted match', () => {
    const result = deleteMatch(
      [
        { id: 'm1', section: 'a', round: 0, position: 0, a: seed(1), b: seed(2) },
        { id: 'm2', section: 'a', round: 1, position: 0, a: { type: 'winner', from: 'm1' }, b: seed(3) },
      ],
      'm1',
    );
    expect(result.map((m) => m.id)).toEqual(['m2']);
    expect(result[0].a).toEqual({ type: 'empty' });
  });

  it('moves a match to another week and renumbers both weeks', () => {
    const result = moveMatch(
      [
        { id: 'm1', section: 'a', round: 0, position: 0, a: seed(1), b: seed(2) },
        { id: 'm2', section: 'a', round: 0, position: 1, a: seed(3), b: seed(4) },
        { id: 'm3', section: 'a', round: 1, position: 0, a: seed(1), b: seed(3) },
      ],
      'm1',
      'a',
      1,
      Number.MAX_SAFE_INTEGER,
    );
    const byId = (id: string) => result.find((m) => m.id === id)!;
    expect(byId('m1').round).toBe(1);
    expect(byId('m1').position).toBe(1);
    expect(byId('m2').position).toBe(0);
  });

  it('turns places from a deleted stage into open slots', () => {
    const draft = draftOf(
      [
        stage('groups'),
        stage('po', {
          type: 'single-elimination',
          entrants: [
            { kind: 'place', sourceStageKey: 'groups', place: 1 },
            { kind: 'team', teamId: 'x' },
          ],
        }),
      ],
      [{ id: 'g1', section: 'groups', round: 0, position: 0, a: seed(1), b: seed(2) }],
    );
    const next = removeStage(draft, 'groups');
    expect(next.stages.map((s) => s.key)).toEqual(['po']);
    expect(next.stages[0].entrants[0]).toEqual({ kind: 'open' });
    expect(next.stages[0].entrantsChanged).toBe(true);
    expect(next.matches).toEqual([]);
  });

  it('round-trips slot values', () => {
    for (const slot of [
      seed(3),
      { type: 'winner', from: 'po:abc:w1-0' } as const,
      { type: 'loser', from: 'x' } as const,
      { type: 'empty' } as const,
    ])
      expect(slotFromValue(slotValue(slot))).toEqual(slot);
  });
});

describe('validateSchedule', () => {
  it('accepts a generated round robin and bracket', () => {
    const draft = draftOf(
      [stage('rr'), stage('po', { type: 'double-elimination' })],
      [
        ...placeStage(generateStage('round-robin', 4), 'rr', 0),
        ...placeStage(generateStage('double-elimination', 4), 'po', 3),
      ],
    );
    expect(validateSchedule(draft)).toEqual([]);
  });

  it('flags TBD sides, missing seeds, reused results and loops', () => {
    const draft = draftOf(
      [stage('po', { type: 'single-elimination' })],
      [
        { id: 'a', section: 'po', round: 0, position: 0, a: { type: 'winner', from: 'b' }, b: seed(9) },
        { id: 'b', section: 'po', round: 1, position: 0, a: { type: 'winner', from: 'a' }, b: { type: 'empty' } },
        { id: 'c', section: 'po', round: 2, position: 0, a: { type: 'winner', from: 'a' }, b: seed(1) },
        { id: 'd', section: 'po', round: 2, position: 1, a: seed(1), b: seed(2) },
      ],
    );
    const errors = validateSchedule(draft).join(' | ');
    expect(errors).toContain('TBD');
    expect(errors).toContain('uses seed 9');
    expect(errors).toContain('goes to two matches');
    expect(errors).toContain('Seed 1 enters po more than once');
    expect(errors).toContain('loop');
  });
});

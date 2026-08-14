import { FlexBracketMatch } from '../league-bracket/bracket.model';
import {
  BuilderDraft,
  cellMatches,
  claimRound,
  insertRound,
  moveStage,
  padRounds,
  trimAutoRounds,
  removeRound,
  reorderRounds,
  roundIsEmpty,
  stageSpans,
} from './stage-builder.model';

const match = (
  id: string,
  round: number,
  section = 'main',
  position = 0,
): FlexBracketMatch => ({
  id,
  round,
  position,
  section,
  a: { type: 'seed', seed: 1 },
  b: { type: 'seed', seed: 2 },
});

const draftOf = (
  matches: FlexBracketMatch[],
  roundCount = 3,
  stages: BuilderDraft['stages'] = [
    {
      key: 'main',
      name: 'Main',
      type: 'round-robin',
      teamIds: [],
      random: false,
      order: 0,
    },
  ],
): BuilderDraft => ({
  rounds: Array.from({ length: roundCount }, (_, i) => ({
    key: `k${i}`,
    name: `Round ${i + 1}`,
  })),
  stages,
  matches,
});

describe('stageSpans', () => {
  it('spans the rounds a section actually occupies', () => {
    const draft = draftOf(
      [
        match('a', 2, 'playoffs'),
        match('b', 4, 'playoffs'),
        match('c', 0, 'groups'),
      ],
      5,
      [
        {
          key: 'groups',
          name: 'Stage',
          type: 'round-robin' as const,
          teamIds: [],
          random: false,
          order: 0,
        },
        {
          key: 'playoffs',
          name: 'Stage',
          type: 'round-robin' as const,
          teamIds: [],
          random: false,
          order: 1,
        },
      ],
    );

    expect(stageSpans(draft)).toEqual([
      { key: 'groups', firstRound: 0, lastRound: 0 },
      { key: 'playoffs', firstRound: 2, lastRound: 4 },
    ]);
  });

  it('gives an empty section a box to drop into', () => {
    const draft = draftOf([], 3, [
      {
        key: 'empty',
        name: 'Stage',
        type: 'round-robin' as const,
        teamIds: [],
        random: false,
        order: 0,
      },
    ]);
    expect(stageSpans(draft)).toEqual([
      { key: 'empty', firstRound: 0, lastRound: 0 },
    ]);
  });

  it('never extends past the rounds its matches occupy', () => {
    const draft = draftOf([match('a', 3, 'playoffs')], 6, [
      {
        key: 'playoffs',
        name: 'Stage',
        type: 'round-robin' as const,
        teamIds: [],
        random: false,
        order: 0,
      },
    ]);
    expect(stageSpans(draft)).toEqual([
      { key: 'playoffs', firstRound: 3, lastRound: 3 },
    ]);
  });

  it('parks a section that has no matches to measure', () => {
    const draft = draftOf([], 5, [
      {
        key: 'new',
        name: 'Stage',
        type: 'round-robin' as const,
        teamIds: [],
        random: false,
        order: 0,
      },
    ]);
    expect(stageSpans(draft, new Map([['new', 3]]))).toEqual([
      { key: 'new', firstRound: 3, lastRound: 3 },
    ]);
  });

  it('orders sections by their configured order', () => {
    const draft = draftOf([match('a', 0, 'late'), match('b', 0, 'early')], 1, [
      {
        key: 'late',
        name: 'Stage',
        type: 'round-robin' as const,
        teamIds: [],
        random: false,
        order: 5,
      },
      {
        key: 'early',
        name: 'Stage',
        type: 'round-robin' as const,
        teamIds: [],
        random: false,
        order: 1,
      },
    ]);
    expect(stageSpans(draft).map((s) => s.key)).toEqual(['early', 'late']);
  });
});

describe('moveStage', () => {
  const twoSections = () =>
    draftOf(
      [
        match('g1', 0, 'groups'),
        match('g2', 1, 'groups'),
        match('p1', 2, 'playoffs'),
        match('p2', 3, 'playoffs'),
      ],
      4,
      [
        {
          key: 'groups',
          name: 'Stage',
          type: 'round-robin' as const,
          teamIds: [],
          random: false,
          order: 0,
        },
        {
          key: 'playoffs',
          name: 'Stage',
          type: 'round-robin' as const,
          teamIds: [],
          random: false,
          order: 1,
        },
      ],
    );

  it('carries every match in the section with it', () => {
    const next = moveStage(twoSections(), 'playoffs', 1);
    const roundOf = (id: string) =>
      next.matches.find((m) => m.id === id)!.round;

    expect(roundOf('p1')).toBe(3);
    expect(roundOf('p2')).toBe(4);
    expect(roundOf('g1')).toBe(0);
    expect(roundOf('g2')).toBe(1);
  });

  it('keeps the section´s shape when moving', () => {
    const next = moveStage(twoSections(), 'playoffs', -2);
    const span = stageSpans(next).find((s) => s.key === 'playoffs')!;
    expect(span.lastRound - span.firstRound).toBe(1);
    expect(span.firstRound).toBe(0);
  });

  it('extends the axis when a section moves past the end', () => {
    const next = moveStage(twoSections(), 'playoffs', 2);
    expect(next.rounds.length).toBe(6);
  });

  it('refuses a move that would run off the top', () => {
    const draft = twoSections();
    expect(moveStage(draft, 'groups', -1)).toBe(draft);
  });

  it('is a no-op for a section with no matches', () => {
    const draft = twoSections();
    expect(moveStage(draft, 'nothing-here', 1)).toBe(draft);
  });
});

describe('insertRound', () => {
  it('pushes matches at or after the insertion point down a row', () => {
    const draft = draftOf([match('a', 0), match('b', 1), match('c', 2)]);
    const next = insertRound(draft, 1, { name: 'Bye Week' });

    expect(next.rounds.map((r) => r.name)).toEqual([
      'Round 1',
      'Bye Week',
      'Round 2',
      'Round 3',
    ]);
    expect(next.matches.map((m) => m.round)).toEqual([0, 2, 3]);
  });

  it('appends when the index is past the end', () => {
    const draft = draftOf([match('a', 0)], 1);
    const next = insertRound(draft, 99, { name: 'Finals' });
    expect(next.rounds.length).toBe(2);
    expect(next.matches[0].round).toBe(0);
  });

  it('moves per-round title overrides with the rows', () => {
    const draft = draftOf([match('a', 1)], 2, [
      {
        key: 'main',
        name: 'Stage',
        type: 'round-robin' as const,
        teamIds: [],
        random: false,
        order: 0,
        roundTitles: { 1: 'Semis' },
      },
    ]);
    const next = insertRound(draft, 0, { name: 'New' });
    expect(next.stages[0].roundTitles).toEqual({ 2: 'Semis' });
  });
});

describe('removeRound', () => {
  it('removes an empty round and pulls later rows up', () => {
    const draft = draftOf([match('a', 0), match('b', 2)]);
    const next = removeRound(draft, 1);
    expect(next.rounds.length).toBe(2);
    expect(next.matches.map((m) => m.round)).toEqual([0, 1]);
  });

  it('refuses to remove a round that still holds matches', () => {
    const draft = draftOf([match('a', 1)]);
    expect(removeRound(draft, 1)).toBe(draft);
  });

  it('reports which rounds are empty', () => {
    const draft = draftOf([match('a', 1)]);
    expect(roundIsEmpty(draft, 0)).toBe(true);
    expect(roundIsEmpty(draft, 1)).toBe(false);
  });
});

describe('reorderRounds', () => {
  it('carries each round´s matches to its new position', () => {
    const draft = draftOf([match('a', 0), match('b', 1), match('c', 2)]);
    const next = reorderRounds(draft, 2, 0);

    expect(next.rounds.map((r) => r.key)).toEqual(['k2', 'k0', 'k1']);
    const roundById = new Map(next.matches.map((m) => [m.id, m.round]));
    expect(roundById.get('c')).toBe(0);
    expect(roundById.get('a')).toBe(1);
    expect(roundById.get('b')).toBe(2);
  });

  it('is a no-op when the position is unchanged', () => {
    const draft = draftOf([match('a', 0)]);
    expect(reorderRounds(draft, 0, 0)).toBe(draft);
  });
});

describe('padRounds', () => {
  it('appends rounds when a match lands past the end of the axis', () => {
    const draft = draftOf([match('a', 4)], 2);
    const next = padRounds(draft);
    expect(next.rounds.length).toBe(5);
    expect(next.rounds[4].name).toBe('Round 5');
  });

  it('leaves an axis that already covers every match alone', () => {
    const draft = draftOf([match('a', 1)], 3);
    expect(padRounds(draft)).toBe(draft);
  });

  it('marks the rounds it adds as auto', () => {
    const padded = padRounds(draftOf([match('a', 3)], 2));
    expect(padded.rounds.map((r) => !!r.auto)).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });
});

describe('trimAutoRounds', () => {
  it('reclaims trailing auto rounds the matches no longer need', () => {
    const grown = padRounds(draftOf([match('a', 3)], 2));
    const movedBack = { ...grown, matches: [match('a', 0)] };
    expect(trimAutoRounds(movedBack).rounds.length).toBe(2);
  });

  it('keeps a round the organizer named', () => {
    const grown = padRounds(draftOf([match('a', 3)], 2));
    const claimed = {
      ...grown,
      rounds: grown.rounds.map((r, i) =>
        i === 3 ? claimRound({ ...r, name: 'Finals' }) : r,
      ),
      matches: [match('a', 0)],
    };
    const next = trimAutoRounds(claimed);
    expect(next.rounds.length).toBe(4);
    expect(next.rounds[3].name).toBe('Finals');
  });

  it('never trims a round that still holds a match', () => {
    const grown = padRounds(draftOf([match('a', 3)], 2));
    expect(trimAutoRounds(grown).rounds.length).toBe(4);
  });

  it('always leaves one row to drop into', () => {
    const empty = {
      ...draftOf([], 0),
      rounds: [{ key: 'k', name: 'Round 1', auto: true }],
    };
    expect(trimAutoRounds(empty).rounds.length).toBe(1);
  });
});

describe('cellMatches', () => {
  it('returns one cell´s matches in position order', () => {
    const draft = draftOf([
      match('second', 0, 'main', 1),
      match('first', 0, 'main', 0),
      match('other-section', 0, 'side', 0),
      match('other-round', 1, 'main', 0),
    ]);
    expect(cellMatches(draft.matches, 'main', 0).map((m) => m.id)).toEqual([
      'first',
      'second',
    ]);
  });
});

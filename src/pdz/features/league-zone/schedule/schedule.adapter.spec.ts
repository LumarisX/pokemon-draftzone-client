import {
  placesFrom,
  resolveEntrant,
  ScheduleContext,
} from './schedule-entrants';
import {
  savedMatchIds,
  toScheduleDraft,
  toUpdatePayload,
} from './schedule.adapter';
import { ScheduleStage } from './schedule.model';
import { TournamentBracket } from './tournament-bracket.model';

const team = (seed: number, id: string) => ({
  seed,
  teamId: id,
  teamSlug: id,
  teamName: id.toUpperCase(),
  coachName: 'Coach',
});

function bracket(): TournamentBracket {
  return {
    rounds: [
      { _id: 'r1', name: 'Week 1' },
      { _id: 'r2', name: 'Week 2' },
    ],
    currentRoundIndex: 0,
    stages: [
      {
        _id: 'groups',
        slug: 'g',
        name: 'Groups',
        type: 'round-robin',
        order: 0,
        public: true,
        seeding: null,
        teams: [team(2, 'b'), team(1, 'a')],
      },
      {
        _id: 'po',
        slug: 'p',
        name: 'Playoffs',
        type: 'single-elimination',
        order: 1,
        public: false,
        seeding: null,
        teams: [team(2, 'b')],
        entrants: [
          { seed: 1, kind: 'place', teamId: null, sourceStageId: 'groups', place: 1 },
          { seed: 2, kind: 'place', teamId: 'b', sourceStageId: 'groups', place: 2 },
        ],
      },
    ],
    projections: [
      {
        stageId: 'groups',
        complete: false,
        standings: [
          { teamId: 'a', teamName: 'A', coachName: 'Coach', wins: 1, draws: 0, losses: 0, points: 3, gameDiff: 2 },
          { teamId: 'b', teamName: 'B', coachName: 'Coach', wins: 0, draws: 0, losses: 1, points: 0, gameDiff: -2 },
        ],
      },
    ],
    matches: [
      {
        _id: 'm1',
        slug: 'm1',
        stage: 'groups',
        round: 'r1',
        position: 0,
        label: null,
        a: { type: 'seed', seed: 1 },
        b: { type: 'seed', seed: 2 },
        winner: 0,
      },
      {
        _id: 'm2',
        slug: 'm2',
        stage: 'po',
        round: 'r2',
        position: 0,
        label: 'Final',
        a: { type: 'seed', seed: 1 },
        b: { type: 'seed', seed: 2 },
      },
    ],
  };
}

describe('toScheduleDraft', () => {
  it('orders team seeds and keeps stored entrants', () => {
    const draft = toScheduleDraft(bracket());
    expect(draft.stages[0].entrants).toEqual([
      { kind: 'team', teamId: 'a' },
      { kind: 'team', teamId: 'b' },
    ]);
    expect(draft.stages[0].drawn).toBe(true);
    expect(draft.stages[1].storesEntrants).toBe(true);
    expect(draft.stages[1].entrants[1]).toEqual({
      kind: 'place',
      sourceStageKey: 'groups',
      place: 2,
      teamId: 'b',
    });
    expect(draft.matches.map((m) => [m.section, m.round])).toEqual([
      ['groups', 0],
      ['po', 1],
    ]);
  });
});

describe('toUpdatePayload', () => {
  it('leaves seeded and stored stages alone until their entrants change', () => {
    const b = bracket();
    const draft = toScheduleDraft(b);
    const payload = toUpdatePayload(draft, savedMatchIds(b));
    expect(payload.stages[0].seedGroups).toBeUndefined();
    expect(payload.stages[1].entrants).toBeUndefined();
    expect(payload.matches.map((m) => m._id)).toEqual(['m1', 'm2']);
  });

  it('sends places as entrants and a new all-team stage as a seed group', () => {
    const draft = toScheduleDraft(bracket());
    const fresh: ScheduleStage = {
      key: 'new',
      name: 'Bonus',
      type: 'round-robin',
      public: true,
      entrants: [
        { kind: 'team', teamId: 'a' },
        { kind: 'team', teamId: 'b' },
      ],
      random: true,
      drawn: false,
      storesEntrants: false,
      entrantsChanged: true,
    };
    const changed = {
      ...draft,
      stages: [
        draft.stages[0],
        { ...draft.stages[1], entrantsChanged: true },
        fresh,
      ],
    };
    const payload = toUpdatePayload(changed, new Set());
    expect(payload.stages[1].entrants).toEqual([
      { kind: 'place', sourceStageKey: 'groups', place: 1 },
      { kind: 'place', sourceStageKey: 'groups', place: 2 },
    ]);
    expect(payload.stages[2].seedGroups).toEqual([
      { teamIds: ['a', 'b'], method: 'certified-random', label: 'Bonus' },
    ]);
    expect(payload.matches.every((m) => m._id === undefined)).toBe(true);
  });
});

describe('entrants', () => {
  const draft = toScheduleDraft(bracket());
  const context: ScheduleContext = {
    teams: new Map([
      ['a', { teamId: 'a', teamName: 'A', coachName: 'Coach' }],
      ['b', { teamId: 'b', teamName: 'B', coachName: 'Coach' }],
    ]),
    projections: new Map(bracket().projections!.map((p) => [p.stageId, p])),
    stages: draft.stages,
  };

  it('shows who holds an unconfirmed place now', () => {
    expect(resolveEntrant(context, draft.stages[1], 1)).toEqual({
      team: null,
      label: 'Groups · 1st',
      detail: 'Now: A',
      kind: 'place',
    });
  });

  it('shows the team once a place is confirmed', () => {
    const resolved = resolveEntrant(context, draft.stages[1], 2);
    expect(resolved.team?.teamName).toBe('B');
    expect(resolved.detail).toBe('Groups · 2nd');
  });

  it('interleaves places from two groups so every first-round match crosses groups', () => {
    const [a, b] = [
      { ...draft.stages[0], key: 'ga' },
      { ...draft.stages[0], key: 'gb' },
    ];
    const seeds = placesFrom([a, b], 4, 'by-place').map(
      (e) => `${e.sourceStageKey}${e.place}`,
    );
    expect(seeds).toEqual(['ga1', 'gb1', 'ga2', 'gb2', 'ga3', 'gb3', 'ga4', 'gb4']);
    for (const [high, low] of [[1, 8], [4, 5], [2, 7], [3, 6]])
      expect(seeds[high - 1].slice(0, 2)).not.toBe(seeds[low - 1].slice(0, 2));
    expect(
      placesFrom([a, b], 2, 'by-stage').map((e) => `${e.sourceStageKey}${e.place}`),
    ).toEqual(['ga1', 'ga2', 'gb1', 'gb2']);
  });
});

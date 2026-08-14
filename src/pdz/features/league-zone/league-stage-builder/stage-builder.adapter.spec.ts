import { TournamentBracket } from '../league-bracket/tournament-bracket.model';
import {
  savedMatchIds,
  toBuilderDraft,
  toUpdatePayload,
} from './stage-builder.adapter';
import { BuilderDraft } from './stage-builder.model';

function buildBracket(
  overrides: Partial<TournamentBracket> = {},
): TournamentBracket {
  return {
    rounds: [],
    currentRoundIndex: -1,
    stages: [],
    matches: [],
    ...overrides,
  };
}

const round = (id: string, name: string) => ({ _id: id, name });

const stage = (
  id: string,
  name: string,
  teamIds: string[] = [],
  type = 'round-robin',
) => ({
  _id: id,
  slug: `${id}-slug`,
  name,
  type,
  order: 0,
  public: true,
  seeding: null,
  teams: teamIds.map((teamId, index) => ({
    seed: index + 1,
    teamId,
    teamSlug: `${teamId}-slug`,
    teamName: `Team ${index + 1}`,
    coachName: `Coach ${index + 1}`,
  })),
});

describe('toBuilderDraft', () => {
  it('gives an empty tournament a single round to drop into', () => {
    const draft = toBuilderDraft(buildBracket());

    expect(draft.rounds.length).toBe(1);
    expect(draft.stages).toEqual([]);
    expect(draft.matches).toEqual([]);
  });

  it('carries the tournament round axis over, keeping server ids', () => {
    const draft = toBuilderDraft(
      buildBracket({ rounds: [round('r1', 'Week 1'), round('r2', 'Week 2')] }),
    );

    expect(draft.rounds.map((r) => r.name)).toEqual(['Week 1', 'Week 2']);
    expect(draft.rounds.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(draft.rounds.map((r) => r.key)).toEqual(['r1', 'r2']);
  });

  it('maps a match onto its round index and owning stage', () => {
    const draft = toBuilderDraft(
      buildBracket({
        rounds: [round('r1', 'Week 1'), round('r2', 'Week 2')],
        stages: [stage('s1', 'Group A', ['t1', 't2'])],
        matches: [
          {
            _id: 'm1',
            slug: 'm1-slug',
            stage: 's1',
            round: 'r2',
            position: 0,
            label: null,
            a: { type: 'seed', seed: 1 },
            b: { type: 'seed', seed: 2 },
          },
        ],
      }),
    );

    expect(draft.matches[0].round).toBe(1);
    expect(draft.matches[0].section).toBe('s1');
    expect(draft.matches[0].a).toEqual({ type: 'seed', seed: 1 });
  });

  it("reads each stage's teams in seed order", () => {
    const draft = toBuilderDraft(
      buildBracket({
        stages: [
          {
            ...stage('s1', 'Group A'),
            teams: [
              {
                seed: 2,
                teamId: 't2',
                teamSlug: 't2-slug',
                teamName: 'B',
                coachName: 'b',
              },
              {
                seed: 1,
                teamId: 't1',
                teamSlug: 't1-slug',
                teamName: 'A',
                coachName: 'a',
              },
            ],
          },
        ],
      }),
    );

    expect(draft.stages[0].teamIds).toEqual(['t1', 't2']);
  });

  it('marks a stage that already has teams as seeded', () => {
    const draft = toBuilderDraft(
      buildBracket({
        stages: [stage('s1', 'A', ['t1']), stage('s2', 'B', [])],
      }),
    );

    expect(draft.stages.map((s) => s.seeded)).toEqual([true, false]);
  });
});

describe('toUpdatePayload', () => {
  const draft = (overrides: Partial<BuilderDraft> = {}): BuilderDraft => ({
    rounds: [{ key: 'r1', id: 'r1', name: 'Week 1' }],
    stages: [
      {
        stageId: 's1',
        key: 's1',
        name: 'Group A',
        type: 'round-robin',
        teamIds: ['t1', 't2'],
        random: false,
        seeded: true,
      },
    ],
    matches: [
      {
        id: 'm1',
        round: 0,
        position: 0,
        section: 's1',
        a: { type: 'seed', seed: 1 },
        b: { type: 'seed', seed: 2 },
      },
    ],
    ...overrides,
  });

  it('keeps server ids so the save updates rather than replaces', () => {
    const payload = toUpdatePayload(draft(), new Set(['m1']));

    expect(payload.rounds[0]._id).toBe('r1');
    expect(payload.stages[0]._id).toBe('s1');
    expect(payload.matches[0]._id).toBe('m1');
  });

  it('omits _id for anything added in this session', () => {
    const payload = toUpdatePayload(
      draft({
        rounds: [{ key: 'local-1', name: 'Week 1' }],
        stages: [
          {
            key: 'new-stage',
            name: 'New',
            type: 'round-robin',
            teamIds: ['t1', 't2'],
            random: true,
          },
        ],
        matches: [
          {
            id: 'custom-1',
            round: 0,
            position: 0,
            section: 'new-stage',
            a: { type: 'seed', seed: 1 },
            b: { type: 'seed', seed: 2 },
          },
        ],
      }),
      new Set(),
    );

    expect(payload.rounds[0]._id).toBeUndefined();
    expect(payload.stages[0]._id).toBeUndefined();
    expect(payload.matches[0]._id).toBeUndefined();
    expect(payload.matches[0].key).toBe('custom-1');
  });

  it('names each match by the stage key its section holds', () => {
    const payload = toUpdatePayload(draft(), new Set(['m1']));

    expect(payload.matches[0].stageKey).toBe('s1');
    expect(payload.matches[0].roundIndex).toBe(0);
  });

  it('sends seed groups only for a stage that has not been drawn', () => {
    const payload = toUpdatePayload(
      draft({
        stages: [
          {
            stageId: 's1',
            key: 's1',
            name: 'Drawn',
            type: 'round-robin',
            teamIds: ['t1', 't2'],
            random: true,
            seeded: true,
          },
          {
            key: 's2',
            name: 'Fresh',
            type: 'round-robin',
            teamIds: ['t3', 't4'],
            random: true,
          },
        ],
      }),
      new Set(['m1']),
    );

    expect(payload.stages[0].seedGroups).toBeUndefined();
    expect(payload.stages[1].seedGroups).toEqual([
      { teamIds: ['t3', 't4'], method: 'certified-random', label: 'Fresh' },
    ]);
  });

  it('sends a manual group when the organizer set the order themselves', () => {
    const payload = toUpdatePayload(
      draft({
        stages: [
          {
            key: 's2',
            name: 'Manual',
            type: 'single-elimination',
            teamIds: ['t3', 't4'],
            random: false,
          },
        ],
      }),
      new Set(),
    );

    expect(payload.stages[0].seedGroups?.[0].method).toBe('manual');
  });

  it('does not renumber seeds — each stage owns its own numbering', () => {
    const payload = toUpdatePayload(
      draft({
        stages: [
          {
            key: 'a',
            name: 'A',
            type: 'round-robin',
            teamIds: ['t1', 't2'],
            random: false,
          },
          {
            key: 'b',
            name: 'B',
            type: 'round-robin',
            teamIds: ['t3', 't4'],
            random: false,
          },
        ],
        matches: [
          {
            id: 'ma',
            round: 0,
            position: 0,
            section: 'a',
            a: { type: 'seed', seed: 1 },
            b: { type: 'seed', seed: 2 },
          },
          {
            id: 'mb',
            round: 0,
            position: 0,
            section: 'b',
            a: { type: 'seed', seed: 1 },
            b: { type: 'seed', seed: 2 },
          },
        ],
      }),
      new Set(),
    );

    expect(payload.matches.map((m) => m.a)).toEqual([
      { type: 'seed', seed: 1 },
      { type: 'seed', seed: 1 },
    ]);
  });

  it('sends a bye as the seed it resolves to', () => {
    const payload = toUpdatePayload(
      draft({
        matches: [
          {
            id: 'm1',
            round: 0,
            position: 0,
            section: 's1',
            a: { type: 'seed', seed: 1 },
            b: { type: 'bye', seed: 2 },
          },
        ],
      }),
      new Set(),
    );

    expect(payload.matches[0].b).toEqual({ type: 'seed', seed: 2 });
  });

  it('sends winner/loser slots by the match they consume', () => {
    const payload = toUpdatePayload(
      draft({
        matches: [
          {
            id: 'm2',
            round: 0,
            position: 0,
            section: 's1',
            a: { type: 'winner', from: 'm1' },
            b: { type: 'loser', from: 'm1' },
          },
        ],
      }),
      new Set(),
    );

    expect(payload.matches[0].a).toEqual({ type: 'winner', from: 'm1' });
    expect(payload.matches[0].b).toEqual({ type: 'loser', from: 'm1' });
  });
});

describe('savedMatchIds', () => {
  it('collects the ids the server already knows', () => {
    const ids = savedMatchIds(
      buildBracket({
        matches: [
          {
            _id: 'm1',
            slug: 'm1-slug',
            stage: 's1',
            round: 'r1',
            position: 0,
            label: null,
            a: null,
            b: null,
          },
        ],
      }),
    );

    expect([...ids]).toEqual(['m1']);
  });
});

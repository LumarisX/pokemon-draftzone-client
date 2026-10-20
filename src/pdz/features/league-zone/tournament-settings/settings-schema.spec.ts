import {
  ArtifactState,
  DraftPoolValue,
  Lifecycle,
  SettingsContext,
  SettingsValue,
  SignUpValue,
  nextSteps,
} from './settings-schema';

function artifacts(overrides: Partial<ArtifactState> = {}): ArtifactState {
  return {
    tierList: {
      name: 'Gen 9 OU',
      slug: 'list',
      format: 'Singles',
      ruleset: 'Gen9',
      pokemonCount: 400,
      tiers: [],
      source: 'custom',
    },
    schedule: { stageCount: 1, roundCount: 7, matchupCount: 28, playedCount: 10 },
    rules: { sectionCount: 0, wordCount: 0 },
    ...overrides,
  };
}

function pool(overrides: Partial<DraftPoolValue> = {}): DraftPoolValue {
  return {
    id: 'pool-a',
    name: 'Draft Pool',
    slug: 'pool-a',
    channelId: '',
    status: 'PRE_DRAFT',
    draftStart: '2026-11-01T20:00',
    draftEnd: '',
    orderProgression: 'snake',
    sequentialTurns: true,
    pickTimerEnabled: true,
    pickTimerMinutes: 60,
    useRandomSeeding: true,
    picksVisibleTo: 'everyone',
    allowDuplicates: false,
    allowRemovals: false,
    teams: [],
    ...overrides,
  };
}

function context(
  phase: Lifecycle,
  overrides: Partial<SettingsContext> = {},
): SettingsContext {
  return {
    value: { seasonStart: '', completed: false } as SettingsValue,
    pools: [pool()],
    signUps: [],
    unassigned: [],
    artifacts: artifacts(),
    phase,
    ...overrides,
  };
}

const ids = (c: SettingsContext) => nextSteps(c).map((step) => step.id);

describe('nextSteps', () => {
  it('asks for a tier list, then to open sign-ups, before anything else', () => {
    expect(
      ids(
        context('setup', {
          artifacts: artifacts({
            tierList: { ...artifacts().tierList, name: null },
          }),
        }),
      ),
    ).toEqual(['tier-list', 'open-signups']);
    expect(ids(context('setup'))).toEqual(['open-signups']);
  });

  it('leaves out settings that already have defaults', () => {
    const steps = ids(context('setup'));
    expect(steps).not.toContain('name');
    expect(steps).not.toContain('discord');
    expect(steps).not.toContain('scoring');
  });

  it('lists only what blocks the draft while sign-ups are open', () => {
    const pending = { status: 'pending' } as SignUpValue;
    const waiting = { status: 'approved' } as SignUpValue;
    expect(
      ids(
        context('signups', {
          signUps: [pending],
          unassigned: [waiting],
          pools: [pool({ draftStart: '' })],
        }),
      ),
    ).toEqual(['review', 'unassigned', 'draft-window']);
    expect(ids(context('signups'))).toEqual([]);
  });

  it('asks for a pool when there is none', () => {
    expect(ids(context('signups', { pools: [] }))).toEqual(['pool']);
  });

  it('asks for the schedule and the season start once the draft is on', () => {
    expect(
      ids(
        context('draft', {
          artifacts: artifacts({
            schedule: { stageCount: 0, roundCount: 0, matchupCount: 0, playedCount: 0 },
          }),
        }),
      ),
    ).toEqual(['schedule', 'season-start']);
  });

  it('asks for the final results review once every match has a result', () => {
    expect(ids(context('season'))).toEqual([]);
    const done = context('season', {
      artifacts: artifacts({
        schedule: { stageCount: 2, roundCount: 9, matchupCount: 31, playedCount: 31 },
      }),
    });
    expect(ids(done)).toEqual(['complete']);
    expect(nextSteps(done)[0].target).toEqual({
      kind: 'page',
      path: ['final-results'],
    });
  });

  it('asks to mark the tournament completed once the season has ended', () => {
    expect(ids(context('complete'))).toEqual(['complete']);
    expect(
      ids(
        context('complete', {
          value: { seasonStart: '', completed: true } as SettingsValue,
        }),
      ),
    ).toEqual([]);
  });
});

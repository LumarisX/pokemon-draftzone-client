import { Injectable, computed, signal } from '@angular/core';
import {
  ArtifactState,
  DraftPoolValue,
  Lifecycle,
  NodeIssue,
  SettingsSectionId,
  SettingsValue,
  SignUpStatus,
  SignUpValue,
  launchChecklist,
  nodesForSection,
  poolErrors,
  sectionKeys,
  settingsErrors,
} from './settings-schema';

export const MOCK_SETTINGS: SettingsValue = {
  name: 'Total Blackout Pokémon League',
  description:
    'Season 12 of TBPL. Champions M-B throughout, played on Switch where possible.',
  logo: null,
  discord: 'https://discord.gg/fE4d2bpS',

  signUpDeadline: '2026-10-05T22:00',

  draftCountMin: 11,
  draftCountMax: 12,
  pointTotalEnabled: true,
  pointTotal: 200,
  tierRequirements: [
    { tierId: 'tier-a', required: 1, max: 2 },
    { tierId: 'tier-b', required: 2, max: null },
    { tierId: 'tier-c', required: 2, max: null },
    { tierId: 'tier-d', required: 2, max: null },
  ],
  tradePointLimitEnabled: false,
  tradePointLimit: 0,

  seasonStart: '2026-10-20T00:00',
  seasonEnd: '2027-01-15T00:00',
  diffMode: 'pokemon',
  forfeitGameDiff: 2,
  forfeitPokemonDiff: 6,
  matchupChat: true,
  coachReporting: true,

  discordGuildId: '',
  discordCoachRoleId: '',
  discordSignUpChannelId: '',

  adAdvertise: true,
  adSkillFrom: '1',
  adSkillTo: '3',
  adPrizeValue: '2',
  adPlatforms: ['Pokémon Champions'],
  prizeSplit: [
    { place: 1, percent: 75 },
    { place: 2, percent: 25 },
  ],

  archived: false,
};

export const MOCK_ARTIFACTS: ArtifactState = {
  tierList: {
    name: 'TBPL S12 Tiers',
    slug: 'k3Qp8Wm2',
    format: 'Champions M-B',
    ruleset: 'Champions Reg M-B',
    pokemonCount: 412,
    tiers: [
      { id: 'tier-a', name: 'A Tier', cost: 22, color: 'primary' },
      { id: 'tier-b', name: 'B Tier', cost: 17, color: 'secondary' },
      { id: 'tier-c', name: 'C Tier', cost: 11, color: 'success' },
      { id: 'tier-d', name: 'D Tier', cost: 5, color: 'neutral' },
    ],
    source: 'custom',
  },
  schedule: { stageCount: 2, roundCount: 11, matchupCount: 66 },
};

export const BLANK_ARTIFACTS: ArtifactState = {
  tierList: {
    name: null,
    slug: null,
    format: '',
    ruleset: '',
    pokemonCount: 0,
    tiers: [],
    source: null,
  },
  schedule: { stageCount: 0, roundCount: 0, matchupCount: 0 },
};

export const BLANK_SETTINGS: SettingsValue = {
  ...MOCK_SETTINGS,
  name: '',
  description: '',
  discord: '',
  signUpDeadline: '',
  tierRequirements: [],
  prizeSplit: [],
  adAdvertise: false,
};

const POOL_DEFAULTS: Omit<DraftPoolValue, 'id' | 'name' | 'teams'> = {
  channelId: '',
  draftStart: '',
  draftEnd: '',
  orderProgression: 'snake',
  sequentialTurns: true,
  pickTimerEnabled: true,
  pickTimerMinutes: 60,
  useRandomSeeding: true,
  visibility: 'ALL',
  allowRemovals: false,
};

const ROSTER: readonly [string, string, string, string, string][] = [
  ['t1', 'Vermilion Voltorbs', 'Lumaris', 'lumaris', 'UTC-5'],
  ['t2', 'Cinnabar Cinders', 'Skylar', 'skyhigh', 'UTC-8'],
  ['t3', 'Saffron Psychics', 'Rowan', 'rowanoak', 'UTC+0'],
  ['t4', 'Fuchsia Fangs', 'Bex', 'bexly', 'UTC-6'],
  ['t5', 'Pewter Bedrock', 'Cass', 'cassrock', 'UTC+1'],
  ['t6', 'Celadon Blossoms', 'Nico', 'nicobloom', 'UTC-5'],
  ['t7', 'Mahogany Frost', 'Kit', 'kitfrost', 'UTC+2'],
  ['t8', 'Blackthorn Wyrms', 'Ari', 'ariwyrm', 'UTC-7'],
  ['t9', 'Goldenrod Gales', 'Tam', 'tamgale', 'UTC-4'],
  ['t10', 'Olivine Tides', 'Wren', 'wrentide', 'UTC+9'],
  ['t11', 'Azalea Hive', 'Juno', 'junohive', 'UTC-5'],
  ['t12', 'Ecruteak Embers', 'Pax', 'paxember', 'UTC+5'],
  ['t13', 'Viridian Vines', 'Sol', 'solvine', 'UTC-3'],
  ['t14', 'Lavender Wisps', 'Remy', 'remywisp', 'UTC+8'],
];

const EXPERIENCE = [
  'Played three seasons of TBPL, mostly mid-table finishes.',
  'First draft league. Ladder peak 1650 in Gen 9 OU.',
  'Hosted a 16-team league last year, coached in two others.',
  'Long-time VGC player, new to draft formats.',
];

function signUp(
  index: number,
  status: SignUpStatus,
  overrides: Partial<SignUpValue> = {},
): SignUpValue {
  const [id, teamName, coach, showdownName, timezone] = ROSTER[index];
  return {
    id,
    status,
    teamName,
    coach,
    showdownName,
    discordName: `${showdownName}#${1000 + index}`,
    timezone,
    experience: EXPERIENCE[index % EXPERIENCE.length],
    signedUpAt: `2026-09-${String(10 + (index % 18)).padStart(2, '0')}T14:30`,
    inDiscordServer: status !== 'pending' || index % 3 !== 0,
    hasDiscordRole: status === 'approved',
    ...overrides,
  };
}

export const MOCK_SIGNUPS: SignUpValue[] = [
  ...Array.from({ length: 12 }, (_, index) => signUp(index, 'approved')),
  signUp(12, 'pending'),
  signUp(13, 'denied'),
];

export const MOCK_POOLS: DraftPoolValue[] = [
  {
    ...POOL_DEFAULTS,
    id: 'pool-alpha',
    name: 'Alpha Division',
    channelId: '984117432098765432',
    draftStart: '2026-10-10T18:00',
    draftEnd: '2026-10-12T22:00',
    teams: ['t1', 't2', 't3', 't4', 't5', 't6'],
  },
  {
    ...POOL_DEFAULTS,
    id: 'pool-beta',
    name: 'Beta Division',
    channelId: '984117432098765433',
    draftStart: '2026-10-10T18:00',
    draftEnd: '2026-10-13T22:00',
    orderProgression: 'linear',
    teams: ['t7', 't8', 't9', 't10', 't11'],
  },
];

export const BLANK_SIGNUPS: SignUpValue[] = [];

export const BLANK_POOLS: DraftPoolValue[] = [
  {
    ...POOL_DEFAULTS,
    id: 'pool-1',
    name: 'Draft Pool',
    teams: [],
  },
];

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

@Injectable()
export class SettingsWorkbenchStore {
  private readonly savedValue = signal<SettingsValue>(MOCK_SETTINGS);
  private readonly draftValue = signal<SettingsValue>(MOCK_SETTINGS);
  private readonly savedPools = signal<DraftPoolValue[]>(MOCK_POOLS);
  private readonly draftPools = signal<DraftPoolValue[]>(clone(MOCK_POOLS));
  private readonly savedSignUps = signal<SignUpValue[]>(MOCK_SIGNUPS);
  private readonly draftSignUps = signal<SignUpValue[]>(clone(MOCK_SIGNUPS));
  private readonly artifactState = signal<ArtifactState>(MOCK_ARTIFACTS);

  readonly artifacts = this.artifactState.asReadonly();
  readonly phase = signal<Lifecycle>('setup');

  readonly saved = this.savedValue.asReadonly();
  readonly draft = this.draftValue.asReadonly();

  readonly pools = this.draftPools.asReadonly();
  readonly signUps = this.draftSignUps.asReadonly();
  readonly poolCount = computed(() => this.pools().length);
  readonly collapsed = computed(() => this.poolCount() <= 1);

  readonly approved = computed(() =>
    this.signUps().filter((entry) => entry.status === 'approved'),
  );

  readonly statusCounts = computed(() => {
    const counts: Record<SignUpStatus, number> = {
      pending: 0,
      approved: 0,
      denied: 0,
      dropped: 0,
    };
    for (const entry of this.signUps()) counts[entry.status] += 1;
    return counts;
  });

  readonly unassigned = computed(() => {
    const placed = new Set(this.pools().flatMap((pool) => pool.teams));
    return this.approved().filter((entry) => !placed.has(entry.id));
  });

  signUpById(id: string): SignUpValue | undefined {
    return this.signUps().find((entry) => entry.id === id);
  }

  poolTeams(poolId: string): SignUpValue[] {
    const pool = this.pools().find((entry) => entry.id === poolId);
    if (!pool) return [];
    return pool.teams
      .map((id) => this.signUpById(id))
      .filter((entry): entry is SignUpValue => !!entry);
  }


  readonly selectedPoolId = signal<string | null>(null);

  readonly selectedPool = computed<DraftPoolValue | null>(() => {
    const pools = this.pools();
    if (!pools.length) return null;
    const id = this.selectedPoolId();
    return pools.find((pool) => pool.id === id) ?? pools[0];
  });

  readonly dirtyKeys = computed(() => {
    const saved = this.savedValue();
    const draft = this.draftValue();
    return (Object.keys(draft) as (keyof SettingsValue)[]).filter(
      (key) => !equal(saved[key], draft[key]),
    );
  });

  readonly poolsDirty = computed(
    () => !equal(this.savedPools(), this.draftPools()),
  );

  readonly signUpsDirty = computed(
    () => !equal(this.savedSignUps(), this.draftSignUps()),
  );

  readonly errors = computed<NodeIssue[]>(() => [
    ...settingsErrors(this.draftValue()),
    ...this.pools().flatMap((pool) => poolErrors(pool)),
  ]);

  readonly checklist = computed(() =>
    launchChecklist({
      value: this.draftValue(),
      pools: this.pools(),
      signUps: this.signUps(),
      unassigned: this.unassigned(),
      artifacts: this.artifactState(),
    }),
  );

  read<T>(key: string, poolId?: string | null): T {
    if (poolId) {
      const pool = this.pools().find((entry) => entry.id === poolId);
      return (pool as unknown as Record<string, T>)?.[key];
    }
    return (this.draftValue() as unknown as Record<string, T>)[key];
  }

  write(key: string, value: unknown, poolId?: string | null): void {
    if (poolId) {
      this.patchPool(poolId, { [key]: value } as Partial<DraftPoolValue>);
      return;
    }
    this.draftValue.update((current) => ({ ...current, [key]: value }));
  }

  errorFor(nodeId: string, poolId: string | null = null): string | null {
    return (
      this.errors().find(
        (entry) => entry.nodeId === nodeId && entry.poolId === poolId,
      )?.message ?? null
    );
  }

  poolHasErrors(poolId: string): boolean {
    return this.errors().some((entry) => entry.poolId === poolId);
  }

  sectionDirtyCount(section: SettingsSectionId): number {
    const keys = new Set(sectionKeys(section));
    const scalar = this.dirtyKeys().filter((key) => keys.has(key)).length;
    if (section === 'draft') return scalar + this.poolDirtyCount();
    if (section === 'signup') return scalar + this.signUpDirtyCount();
    return scalar;
  }

  private signUpDirtyCount(): number {
    const saved = new Map(this.savedSignUps().map((entry) => [entry.id, entry]));
    return this.signUps().filter((entry) => !equal(saved.get(entry.id), entry))
      .length;
  }

  sectionHasErrors(section: SettingsSectionId): boolean {
    const ids = new Set(nodesForSection(section).map((node) => node.id));
    const scalar = this.errors().some(
      (entry) => entry.poolId === null && ids.has(entry.nodeId),
    );
    if (section !== 'draft') return scalar;
    return scalar || this.errors().some((entry) => entry.poolId !== null);
  }

  private poolDirtyCount(): number {
    const saved = new Map(this.savedPools().map((pool) => [pool.id, pool]));
    const draft = this.pools();
    let changed = draft.filter(
      (pool) => !equal(saved.get(pool.id), pool),
    ).length;
    for (const id of saved.keys()) {
      if (!draft.some((pool) => pool.id === id)) changed += 1;
    }
    return changed;
  }

  poolDirty(poolId: string): boolean {
    const saved = this.savedPools().find((pool) => pool.id === poolId);
    const draft = this.pools().find((pool) => pool.id === poolId);
    return !equal(saved, draft);
  }

  saveSection(section: SettingsSectionId): void {
    const draft = this.draftValue();
    this.savedValue.update((current) => {
      const next = { ...current } as Record<string, unknown>;
      for (const key of sectionKeys(section)) {
        next[key] = (draft as unknown as Record<string, unknown>)[key];
      }
      return next as unknown as SettingsValue;
    });
    if (section === 'draft') this.savedPools.set(clone(this.draftPools()));
    if (section === 'signup')
      this.savedSignUps.set(clone(this.draftSignUps()));
  }

  revertSection(section: SettingsSectionId): void {
    const saved = this.savedValue();
    this.draftValue.update((current) => {
      const next = { ...current } as Record<string, unknown>;
      for (const key of sectionKeys(section)) {
        next[key] = (saved as unknown as Record<string, unknown>)[key];
      }
      return next as unknown as SettingsValue;
    });
    if (section === 'draft') this.draftPools.set(clone(this.savedPools()));
    if (section === 'signup')
      this.draftSignUps.set(clone(this.savedSignUps()));
  }

  private patchPool(poolId: string, patch: Partial<DraftPoolValue>): void {
    this.draftPools.update((pools) =>
      pools.map((pool) => (pool.id === poolId ? { ...pool, ...patch } : pool)),
    );
  }

  addPool(): void {
    const id = `pool-${Date.now()}`;
    this.draftPools.update((pools) => [
      ...pools,
      {
        ...POOL_DEFAULTS,
        id,
        name: `Pool ${pools.length + 1}`,
        teams: [],
      },
    ]);
    this.selectedPoolId.set(id);
  }

  removePool(poolId: string): void {
    this.draftPools.update((pools) =>
      pools.filter((pool) => pool.id !== poolId),
    );
    this.selectedPoolId.set(this.pools()[0]?.id ?? null);
  }

  renumberPool(poolId: string, from: number, to: number): void {
    const pool = this.pools().find((entry) => entry.id === poolId);
    if (!pool) return;
    const teams = [...pool.teams];
    const [moved] = teams.splice(from, 1);
    teams.splice(to, 0, moved);
    this.patchPool(poolId, { teams });
  }

  assignTeam(signUpId: string, toPoolId: string | null): void {
    this.draftPools.update((pools) =>
      pools.map((pool) => {
        const without = pool.teams.filter((id) => id !== signUpId);
        if (pool.id !== toPoolId) {
          return without.length === pool.teams.length
            ? pool
            : { ...pool, teams: without };
        }
        return { ...pool, teams: [...without, signUpId] };
      }),
    );
  }

  setSignUpStatus(signUpId: string, status: SignUpStatus): void {
    this.draftSignUps.update((entries) =>
      entries.map((entry) =>
        entry.id === signUpId ? { ...entry, status } : entry,
      ),
    );
    if (status !== 'approved') this.assignTeam(signUpId, null);
  }

  setStatusForAll(signUpIds: readonly string[], status: SignUpStatus): void {
    for (const id of signUpIds) this.setSignUpStatus(id, status);
  }

  applyWindowToAllPools(sourcePoolId: string): void {
    const source = this.pools().find((pool) => pool.id === sourcePoolId);
    if (!source) return;
    this.draftPools.update((pools) =>
      pools.map((pool) => ({
        ...pool,
        draftStart: source.draftStart,
        draftEnd: source.draftEnd,
      })),
    );
  }

  reset(
    value: SettingsValue,
    pools: DraftPoolValue[],
    signUps: SignUpValue[],
    artifacts: ArtifactState,
  ): void {
    this.savedValue.set(value);
    this.draftValue.set(value);
    this.savedPools.set(clone(pools));
    this.draftPools.set(clone(pools));
    this.savedSignUps.set(clone(signUps));
    this.draftSignUps.set(clone(signUps));
    this.artifactState.set(artifacts);
    this.selectedPoolId.set(pools[0]?.id ?? null);
  }
}

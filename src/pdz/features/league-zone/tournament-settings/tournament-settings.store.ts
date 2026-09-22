import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { LeagueTier } from '@pdz/features/tier-lists/tier-list.model';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { LeagueManageService } from '../league-manage/league-manage.service';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import {
  ArtifactState,
  DraftPoolValue,
  Lifecycle,
  NodeIssue,
  PrizeShare,
  SettingsSectionId,
  SettingsValue,
  SignUpStatus,
  SignUpValue,
  TierRequirement,
  draftNotStarted,
  launchChecklist,
  nodesForSection,
  poolErrors,
  sectionKeys,
  settingsErrors,
} from './settings-schema';

const NON_DRAFTABLE_TIER_NAMES = new Set(['untiered', 'ban', 'banned']);

const AD_PLATFORMS = [
  'Pokémon Showdown',
  'Pokémon Champions',
  'Scarlet/Violet',
];

const EMPTY_SETTINGS: SettingsValue = {
  name: '',
  description: '',
  logo: null,
  discord: '',
  signUpDeadline: '',
  draftCountMin: 1,
  draftCountMax: 1,
  pointTotalEnabled: false,
  pointTotal: 0,
  tierRequirements: [],
  tradePointLimitEnabled: false,
  tradePointLimit: 0,
  draftStart: '',
  draftEnd: '',
  seasonStart: '',
  seasonEnd: '',
  diffMode: 'pokemon',
  forfeitGameDiff: 0,
  forfeitPokemonDiff: 0,
  matchupChat: true,
  coachReporting: true,
  discordGuildId: '',
  discordCoachRoleId: '',
  discordSignUpChannelId: '',
  adAdvertise: false,
  adSkillFrom: '0',
  adSkillTo: '3',
  adPrizeValue: '0',
  adPlatforms: [],
  prizeSplit: [],
  archived: false,
};

const EMPTY_ARTIFACTS: ArtifactState = {
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
  rules: { sectionCount: 0, wordCount: 0 },
};

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toLocalInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

type SettingsResponse =
  ReturnType<LeagueManageService['getTournamentSettings']> extends Observable<
    infer T
  >
    ? T
    : never;

@Injectable()
export class TournamentSettingsStore {
  private readonly manage = inject(LeagueManageService);
  private readonly league = inject(LeagueZoneService);
  private readonly tierLists = inject(TierListService);

  private readonly savedValue = signal<SettingsValue>(EMPTY_SETTINGS);
  private readonly draftValue = signal<SettingsValue>(EMPTY_SETTINGS);
  private readonly savedPools = signal<DraftPoolValue[]>([]);
  private readonly draftPools = signal<DraftPoolValue[]>([]);
  private readonly savedSignUps = signal<SignUpValue[]>([]);
  private readonly draftSignUps = signal<SignUpValue[]>([]);
  private readonly artifactState = signal<ArtifactState>(EMPTY_ARTIFACTS);

  readonly pendingReports = signal(0);
  readonly pendingTrades = signal(0);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);

  readonly artifacts = this.artifactState.asReadonly();
  readonly saved = this.savedValue.asReadonly();
  readonly draft = this.draftValue.asReadonly();
  readonly pools = this.draftPools.asReadonly();
  readonly signUps = this.draftSignUps.asReadonly();

  readonly poolCount = computed(() => this.pools().length);
  readonly collapsed = computed(() => this.poolCount() <= 1);

  readonly phase = computed<Lifecycle>(() => {
    const value = this.draftValue();
    const now = Date.now();
    const at = (input: string) => {
      const date = fromLocalInput(input);
      return date ? date.getTime() : null;
    };

    if (value.archived) return 'complete';

    const seasonEnd = at(value.seasonEnd);
    if (seasonEnd && now > seasonEnd) return 'complete';

    const seasonStart = at(value.seasonStart);
    if (seasonStart && now >= seasonStart) return 'season';

    const anyDraftStarted = this.savedPools().some(
      (pool) => !draftNotStarted(pool.status),
    );
    if (anyDraftStarted) return 'draft';

    const draftStart = at(value.draftStart);
    if (draftStart && now >= draftStart) return 'draft';

    const deadline = at(value.signUpDeadline);
    if (deadline || this.savedSignUps().length) return 'signups';

    return 'setup';
  });

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

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      settings: this.manage.getTournamentSettings(),
      tierList: optional(this.tierLists.getTierList()),
      coaches: optional(this.league.getSignUps()),
      schedule: optional(this.manage.getSchedule()),
      rules: optional(this.league.getRules()),
      trades: optional(this.manage.getTrades()),
    })
      .pipe(
        switchMap((data) => {
          const slugs = (data.coaches?.drafts ?? []).map(
            (entry) => entry.draftSlug,
          );
          if (!slugs.length) return of({ ...data, details: [] });
          return forkJoin(
            slugs.map((slug) =>
              this.league
                .getDraftDetails(slug)
                .pipe(catchError(() => of(null))),
            ),
          ).pipe(map((details) => ({ ...data, details })));
        }),
      )
      .subscribe({
        next: ({ settings, tierList, coaches, schedule, rules, trades, details }) => {
          this.hydrate(settings, tierList, coaches, schedule, rules, trades, details);
          this.loading.set(false);
        },
        error: (err) => {
          this.loadError.set(
            err?.error?.message ?? 'Failed to load tournament settings.',
          );
          this.loading.set(false);
        },
      });
  }

  private hydrate(
    settings: SettingsResponse,
    tierList: TierListResponse | null,
    coaches: CoachesResponse | null,
    schedule: ScheduleResponse | null,
    rules: League.RuleSection[] | null,
    trades: TradesResponse | null,
    details: (DraftDetailsResponse | null)[],
  ): void {
    const value: SettingsValue = {
      name: settings.name,
      description: settings.description ?? '',
      logo: settings.logo ?? null,
      discord: settings.discord ?? '',
      signUpDeadline: toLocalInput(settings.signUpDeadline),
      draftCountMin: settings.draftCount?.min ?? 1,
      draftCountMax: settings.draftCount?.max ?? 1,
      pointTotalEnabled: settings.pointTotal != null,
      pointTotal: settings.pointTotal ?? 0,
      tierRequirements: (settings.tierRequirements ?? []).map((req) => ({
        tierId: req.tierId,
        required: req.required,
        max: req.max ?? null,
      })),
      tradePointLimitEnabled: settings.tradePointLimit != null,
      tradePointLimit: settings.tradePointLimit ?? 0,
      draftStart: toLocalInput(settings.draftStart),
      draftEnd: toLocalInput(settings.draftEnd),
      seasonStart: toLocalInput(settings.seasonStart),
      seasonEnd: toLocalInput(settings.seasonEnd),
      diffMode: settings.diffMode ?? 'pokemon',
      forfeitGameDiff: settings.forfeit?.gameDiff ?? 0,
      forfeitPokemonDiff: settings.forfeit?.pokemonDiff ?? 0,
      matchupChat: settings.matchSettings?.chat !== false,
      coachReporting: settings.matchSettings?.coachReporting !== false,
      discordGuildId: settings.discordSettings?.guildId ?? '',
      discordCoachRoleId: settings.discordSettings?.coachRoleId ?? '',
      discordSignUpChannelId: settings.discordSettings?.signUpChannelId ?? '',
      adAdvertise: settings.adSettings?.advertise ?? false,
      adSkillFrom: settings.adSettings?.skillLevelRange?.from ?? '0',
      adSkillTo: settings.adSettings?.skillLevelRange?.to ?? '3',
      adPrizeValue: settings.adSettings?.prizeValue ?? '0',
      adPlatforms: [...(settings.adSettings?.platforms ?? [])].filter(
        (platform) => AD_PLATFORMS.includes(platform),
      ),
      prizeSplit: [...(settings.prizeSplit ?? [])].sort(
        (a, b) => a.place - b.place,
      ),
      archived: settings.archived ?? false,
    };

    const signUps: SignUpValue[] = (coaches?.signups ?? []).map((entry) => ({
      id: entry.id,
      teamId: entry.teamId ?? null,
      teamSlug: entry.teamSlug ?? null,
      logo: entry.logo ?? null,
      status: entry.status,
      teamName: entry.teamName,
      coach: entry.name,
      showdownName: entry.gameName,
      discordName: entry.discordName,
      timezone: entry.timezone,
      experience: entry.experience,
      signedUpAt: toLocalInput(entry.signedUpAt),
      inDiscordServer: entry.inDiscordServer ?? false,
      hasDiscordRole: entry.hasDiscordRole ?? false,
    }));

    const detailBySlug = new Map(
      (coaches?.drafts ?? []).map((entry, index) => [
        entry.draftSlug,
        details[index] ?? null,
      ]),
    );

    const pools: DraftPoolValue[] = (coaches?.drafts ?? []).map((entry) => {
      const detail = detailBySlug.get(entry.draftSlug) ?? null;
      const members = signUps.filter(
        (signUp) =>
          (coaches?.signups ?? []).find((raw) => raw.id === signUp.id)
            ?.draft === entry.draftSlug,
      );
      return {
        id: entry.draftSlug,
        slug: entry.draftSlug,
        name: detail?.draftName ?? entry.name,
        channelId: detail?.channelId ?? '',
        status: detail?.status ?? 'PRE_DRAFT',
        draftStart: toLocalInput(detail?.draftStart),
        draftEnd: toLocalInput(detail?.draftEnd),
        orderProgression: detail?.orderProgression ?? 'snake',
        sequentialTurns: detail?.sequentialTurns ?? true,
        pickTimerEnabled: detail ? !detail.noTimer : true,
        pickTimerMinutes: secondsToMinutes(detail?.timerLength),
        useRandomSeeding: detail?.useRandomSeeding ?? true,
        visibility: detail?.visibility ?? 'ALL',
        allowRemovals: detail?.allowRemovals ?? false,
        teams: orderMembers(members, detail?.teamOrder ?? []),
      };
    });

    const tiers = (tierList?.tierList ?? []).flatMap((tier) =>
      tier.id && !NON_DRAFTABLE_TIER_NAMES.has(tier.name.trim().toLowerCase())
        ? [
            {
              id: tier.id,
              name: tier.name,
              cost: tier.cost ?? 0,
              color: 'neutral',
            },
          ]
        : [],
    );

    this.artifactState.set({
      tierList: {
        name: tierList?.name ?? null,
        slug: settings.tierListId || null,
        format: tierList?.format ?? settings.format ?? '',
        ruleset: tierList?.ruleset ?? settings.ruleset ?? '',
        pokemonCount: countPokemon(tierList?.tierList ?? []),
        tiers,
        source: tierList ? 'custom' : null,
      },
      schedule: summariseSchedule(schedule),
      rules: summariseRules(rules),
    });

    this.pendingReports.set(countPendingReports(schedule));
    this.pendingTrades.set(countPendingTrades(trades));

    this.savedValue.set(value);
    this.draftValue.set(clone(value));
    this.savedPools.set(pools);
    this.draftPools.set(clone(pools));
    this.savedSignUps.set(signUps);
    this.draftSignUps.set(clone(signUps));
    this.selectedPoolId.set(pools[0]?.id ?? null);
  }

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
    if (section === 'signup') return scalar + this.statusDirtyCount();
    return scalar;
  }

  private statusDirtyCount(): number {
    return this.statusPatch().length;
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
    return this.pools().filter((pool) => !equal(saved.get(pool.id), pool))
      .length;
  }

  poolDirty(poolId: string): boolean {
    const saved = this.savedPools().find((pool) => pool.id === poolId);
    const draft = this.pools().find((pool) => pool.id === poolId);
    return !equal(saved, draft);
  }

  saveSection(section: SettingsSectionId): Observable<unknown> {
    this.saving.set(true);
    this.saveError.set(null);

    const requests: Observable<unknown>[] = [];
    const settings = {
      ...(this.settingsPatch(section) ?? {}),
      ...(section === 'draft' ? this.derivedWindowPatch() : {}),
    };
    if (Object.keys(settings).length) {
      requests.push(this.manage.updateTournamentSettings(settings));
    }
    const assignments =
      section === 'signup'
        ? this.statusPatch()
        : section === 'draft'
          ? this.membershipPatch()
          : [];
    if (assignments.length) {
      requests.push(this.league.updateSignUps(assignments));
    }
    if (section === 'draft') requests.push(...this.poolRequests());

    const work = requests.length ? forkJoin(requests) : of([]);
    return work.pipe(
      tap({
        next: () => {
          this.commitSection(section);
          this.saving.set(false);
        },
        error: (err) => {
          this.saveError.set(
            err?.error?.message ?? 'Failed to save. Please try again.',
          );
          this.saving.set(false);
        },
      }),
    );
  }

  private derivedWindowPatch(): {
    draftStart?: Date;
    draftEnd?: Date;
  } {
    const saved = new Map(this.savedPools().map((pool) => [pool.id, pool]));
    const changed = this.pools().some((pool) => {
      const before = saved.get(pool.id);
      return (
        !before ||
        before.draftStart !== pool.draftStart ||
        before.draftEnd !== pool.draftEnd
      );
    });
    if (!changed) return {};

    const starts = this.pools()
      .map((pool) => fromLocalInput(pool.draftStart))
      .filter((date): date is Date => !!date);
    const ends = this.pools()
      .map((pool) => fromLocalInput(pool.draftEnd))
      .filter((date): date is Date => !!date);

    return {
      draftStart: starts.length
        ? new Date(Math.min(...starts.map((date) => date.getTime())))
        : undefined,
      draftEnd: ends.length
        ? new Date(Math.max(...ends.map((date) => date.getTime())))
        : undefined,
    };
  }

  private settingsPatch(
    section: SettingsSectionId,
  ): Parameters<LeagueManageService['updateTournamentSettings']>[0] | null {
    const keys = new Set(sectionKeys(section));
    const dirty = this.dirtyKeys().filter((key) => keys.has(key));
    if (!dirty.length) return null;

    const v = this.draftValue();
    const touched = (...names: (keyof SettingsValue)[]) =>
      names.some((name) => dirty.includes(name));

    return {
      ...(touched('name') ? { name: v.name } : {}),
      ...(touched('description')
        ? { description: v.description || undefined }
        : {}),
      ...(touched('logo') ? { logo: v.logo } : {}),
      ...(touched('archived') ? { archived: v.archived } : {}),
      ...(touched('signUpDeadline')
        ? { signUpDeadline: fromLocalInput(v.signUpDeadline) }
        : {}),
      ...(touched('seasonStart', 'seasonEnd')
        ? {
            seasonStart: fromLocalInput(v.seasonStart),
            seasonEnd: fromLocalInput(v.seasonEnd),
          }
        : {}),
      ...(touched('draftCountMin', 'draftCountMax')
        ? { draftCount: { min: v.draftCountMin, max: v.draftCountMax } }
        : {}),
      ...(touched('pointTotalEnabled', 'pointTotal')
        ? { pointTotal: v.pointTotalEnabled ? v.pointTotal : null }
        : {}),
      ...(touched('tradePointLimitEnabled', 'tradePointLimit')
        ? {
            tradePointLimit: v.tradePointLimitEnabled
              ? v.tradePointLimit
              : null,
          }
        : {}),
      ...(touched('tierRequirements')
        ? {
            tierRequirements: v.tierRequirements
              .filter((req) => req.required > 0 || req.max != null)
              .map((req) => ({
                tierId: req.tierId,
                required: req.required,
                ...(req.max == null ? {} : { max: req.max }),
              })),
          }
        : {}),
      ...(touched('prizeSplit') ? { prizeSplit: v.prizeSplit } : {}),
      ...(touched('diffMode') ? { diffMode: v.diffMode } : {}),
      ...(touched('forfeitGameDiff', 'forfeitPokemonDiff')
        ? {
            forfeit: {
              gameDiff: v.forfeitGameDiff,
              pokemonDiff: v.forfeitPokemonDiff,
            },
          }
        : {}),
      ...(touched('matchupChat', 'coachReporting')
        ? {
            matchSettings: {
              chat: v.matchupChat,
              coachReporting: v.coachReporting,
            },
          }
        : {}),
      ...(touched('discord') ? { discord: v.discord || undefined } : {}),
      ...(touched(
        'discordGuildId',
        'discordCoachRoleId',
        'discordSignUpChannelId',
      )
        ? {
            discordSettings: {
              guildId: v.discordGuildId || undefined,
              coachRoleId: v.discordCoachRoleId || undefined,
              signUpChannelId: v.discordSignUpChannelId || undefined,
            },
          }
        : {}),
      ...(touched('adAdvertise', 'adSkillFrom', 'adSkillTo', 'adPrizeValue', 'adPlatforms')
        ? {
            adSettings: {
              advertise: v.adAdvertise,
              skillLevelRange: { from: v.adSkillFrom, to: v.adSkillTo },
              prizeValue: v.adPrizeValue,
              platforms: v.adPlatforms,
            },
          }
        : {}),
    };
  }

  private statusPatch(): SignUpAssignment[] {
    const saved = new Map(
      this.savedSignUps().map((entry) => [entry.id, entry.status]),
    );
    const pool = this.poolBySignUp(this.pools());
    return this.signUps().flatMap((entry) =>
      saved.get(entry.id) === entry.status
        ? []
        : [{ id: entry.id, draft: pool.get(entry.id), status: entry.status }],
    );
  }

  private membershipPatch(): SignUpAssignment[] {
    const saved = this.poolBySignUp(this.savedPools());
    const draft = this.poolBySignUp(this.pools());
    return this.signUps().flatMap((entry) => {
      const pool = draft.get(entry.id);
      return saved.get(entry.id) === pool
        ? []
        : [{ id: entry.id, draft: pool, status: entry.status }];
    });
  }

  private poolBySignUp(pools: DraftPoolValue[]): Map<string, string | undefined> {
    const map = new Map<string, string | undefined>();
    for (const pool of pools) {
      for (const id of pool.teams) map.set(id, pool.slug);
    }
    return map;
  }

  private poolRequests(): Observable<unknown>[] {
    const saved = new Map(this.savedPools().map((pool) => [pool.id, pool]));
    const requests: Observable<unknown>[] = [];

    for (const pool of this.pools()) {
      const before = saved.get(pool.id);
      if (!before || equal(before, pool)) continue;

      const preDraft = draftNotStarted(pool.status);
      const settings: Record<string, unknown> = {};
      if (before.name !== pool.name) settings['name'] = pool.name;
      if (before.channelId !== pool.channelId) {
        settings['channelId'] = pool.channelId || null;
      }
      if (before.visibility !== pool.visibility) {
        settings['visibility'] = pool.visibility;
      }
      if (before.allowRemovals !== pool.allowRemovals) {
        settings['allowRemovals'] = pool.allowRemovals;
      }
      if (before.draftStart !== pool.draftStart) {
        settings['draftStart'] = fromLocalInput(pool.draftStart)?.toISOString() ?? null;
      }
      if (before.draftEnd !== pool.draftEnd) {
        settings['draftEnd'] = fromLocalInput(pool.draftEnd)?.toISOString() ?? null;
      }
      if (preDraft) {
        if (before.orderProgression !== pool.orderProgression) {
          settings['orderProgression'] = pool.orderProgression;
        }
        if (before.sequentialTurns !== pool.sequentialTurns) {
          settings['sequentialTurns'] = pool.sequentialTurns;
        }
        if (before.pickTimerMinutes !== pool.pickTimerMinutes) {
          settings['timerLength'] = Math.round(pool.pickTimerMinutes * 60);
        }
      }
      if (Object.keys(settings).length) {
        requests.push(this.manage.updateDraftSettingsFor(pool.slug, settings));
      }

      if (before.pickTimerEnabled !== pool.pickTimerEnabled) {
        requests.push(
          this.manage.setNoTimerFor(pool.slug, !pool.pickTimerEnabled),
        );
      }

      const orderChanged =
        before.useRandomSeeding !== pool.useRandomSeeding ||
        !equal(before.teams, pool.teams);
      if (preDraft && orderChanged) {
        const order = pool.teams
          .map((id) => this.signUpById(id)?.teamId)
          .filter((id): id is string => !!id);
        requests.push(
          this.manage.setDraftOrderFor(pool.slug, {
            useRandomSeeding: pool.useRandomSeeding,
            ...(pool.useRandomSeeding ? {} : { order }),
          }),
        );
      }
    }

    return requests;
  }

  private commitSection(section: SettingsSectionId): void {
    const draft = this.draftValue();
    this.savedValue.update((current) => {
      const next = { ...current } as Record<string, unknown>;
      for (const key of sectionKeys(section)) {
        next[key] = (draft as unknown as Record<string, unknown>)[key];
      }
      return next as unknown as SettingsValue;
    });
    if (section === 'draft') this.savedPools.set(clone(this.draftPools()));
    if (section === 'signup') {
      this.savedSignUps.set(clone(this.draftSignUps()));
    }
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
    if (section === 'signup') {
      this.draftSignUps.set(clone(this.savedSignUps()));
    }
  }

  nextPoolName(): string {
    const taken = new Set(this.pools().map((pool) => pool.name.trim()));
    if (!taken.size) return 'Draft Pool';
    for (let index = taken.size + 1; ; index += 1) {
      const name = `Pool ${index}`;
      if (!taken.has(name)) return name;
    }
  }

  addPool(name: string): Observable<unknown> {
    this.saving.set(true);
    this.saveError.set(null);
    return this.manage.createDraftPool({ name }).pipe(
      tap({
        next: (created) => {
          const pool: DraftPoolValue = {
            id: created.draftSlug,
            slug: created.draftSlug,
            name: created.name,
            channelId: '',
            status: 'PRE_DRAFT',
            draftStart: '',
            draftEnd: '',
            orderProgression: 'snake',
            sequentialTurns: true,
            pickTimerEnabled: true,
            pickTimerMinutes: DEFAULT_TIMER_MINUTES,
            useRandomSeeding: true,
            visibility: 'ALL',
            allowRemovals: false,
            teams: [],
          };
          this.savedPools.update((pools) => [...pools, clone(pool)]);
          this.draftPools.update((pools) => [...pools, pool]);
          this.selectedPoolId.set(pool.id);
          this.saving.set(false);
        },
        error: (err) => {
          this.saveError.set(
            err?.error?.message ?? 'Could not create that pool.',
          );
          this.saving.set(false);
        },
      }),
    );
  }

  removePool(poolId: string): Observable<unknown> {
    const pool = this.pools().find((entry) => entry.id === poolId);
    if (!pool) return of(null);

    this.saving.set(true);
    this.saveError.set(null);
    return this.manage.deleteDraftPool(pool.slug).pipe(
      tap({
        next: () => {
          const without = (pools: DraftPoolValue[]) =>
            pools.filter((entry) => entry.id !== poolId);
          this.savedPools.update(without);
          this.draftPools.update(without);
          this.selectedPoolId.set(this.pools()[0]?.id ?? null);
          this.saving.set(false);
        },
        error: (err) => {
          this.saveError.set(
            err?.error?.message ?? 'Could not delete that pool.',
          );
          this.saving.set(false);
        },
      }),
    );
  }

  private patchPool(poolId: string, patch: Partial<DraftPoolValue>): void {
    this.draftPools.update((pools) =>
      pools.map((pool) => (pool.id === poolId ? { ...pool, ...patch } : pool)),
    );
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

  setSignUpStatus(signUpId: string, status: SignUpStatus): void {
    this.draftSignUps.update((entries) =>
      entries.map((entry) =>
        entry.id === signUpId ? { ...entry, status } : entry,
      ),
    );
    if (status !== 'approved') this.assignTeam(signUpId, null);
  }

  patchSignUp(
    signUpId: string,
    changes: {
      name?: string;
      gameName?: string;
      discordName?: string;
      timezone?: string;
      teamName?: string;
      logo?: string;
    },
  ): void {
    const apply = (entry: SignUpValue): SignUpValue =>
      entry.id === signUpId
        ? {
            ...entry,
            ...(changes.name === undefined ? {} : { coach: changes.name }),
            ...(changes.gameName === undefined
              ? {}
              : { showdownName: changes.gameName }),
            ...(changes.discordName === undefined
              ? {}
              : { discordName: changes.discordName }),
            ...(changes.timezone === undefined
              ? {}
              : { timezone: changes.timezone }),
            ...(changes.teamName === undefined
              ? {}
              : { teamName: changes.teamName }),
            ...(changes.logo === undefined ? {} : { logo: changes.logo }),
          }
        : entry;

    this.draftSignUps.update((entries) => entries.map(apply));
    this.savedSignUps.update((entries) => entries.map(apply));
  }

  dropSignUp(signUpId: string): void {
    const without = (entries: SignUpValue[]) =>
      entries.filter((entry) => entry.id !== signUpId);
    this.draftSignUps.update(without);
    this.savedSignUps.update(without);
    this.assignTeam(signUpId, null);
    this.savedPools.update((pools) =>
      pools.map((pool) => ({
        ...pool,
        teams: pool.teams.filter((id) => id !== signUpId),
      })),
    );
  }

  setStatusForAll(signUpIds: readonly string[], status: SignUpStatus): void {
    for (const id of signUpIds) this.setSignUpStatus(id, status);
  }
}

type SignUpAssignment = {
  id: string;
  draft?: string;
  status: League.SignUpStatus;
};

type TierListResponse = {
  tierList: LeagueTier[];
  format?: string;
  ruleset?: string;
  name?: string;
};

type CoachesResponse = {
  signups: League.LeagueSignUp[];
  drafts: { name: string; draftSlug: string }[];
};

type TradesResponse = {
  rounds: { name: string; trades: { status: string }[] }[];
};

type ScheduleResponse = {
  rounds: League.ScheduleRound[];
  currentRoundIndex: number;
};

type DraftDetailsResponse = {
  draftName: string;
  teamOrder: string[];
  useRandomSeeding: boolean;
  channelId?: string;
  orderProgression: 'snake' | 'linear';
  sequentialTurns: boolean;
  visibility: 'ALL' | 'SELF';
  allowRemovals: boolean;
  status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  noTimer: boolean;
  timerLength?: number;
  draftStart?: string;
  draftEnd?: string;
};

const DEFAULT_TIMER_MINUTES = 60;

function secondsToMinutes(seconds: number | undefined): number {
  if (!seconds) return DEFAULT_TIMER_MINUTES;
  return Math.max(1, Math.round(seconds / 60));
}

function orderMembers(
  members: SignUpValue[],
  teamOrder: readonly string[],
): string[] {
  const position = new Map(teamOrder.map((id, index) => [id, index]));
  return [...members]
    .sort((a, b) => {
      const left = a.teamId ? position.get(a.teamId) : undefined;
      const right = b.teamId ? position.get(b.teamId) : undefined;
      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      return left - right;
    })
    .map((entry) => entry.id);
}

function summariseRules(
  rules: League.RuleSection[] | null,
): ArtifactState['rules'] {
  const sections = rules ?? [];
  const wordCount = sections.reduce(
    (sum, section) =>
      sum + (section.body ?? '').trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  return { sectionCount: sections.length, wordCount };
}

function countPendingReports(schedule: ScheduleResponse | null): number {
  if (!schedule?.rounds?.length) return 0;
  let count = 0;
  for (const round of schedule.rounds) {
    for (const stage of round.stages ?? []) {
      for (const matchup of stage.matchups ?? []) {
        if (matchup.report && matchup.status !== 'approved') count += 1;
      }
    }
  }
  return count;
}

function countPendingTrades(trades: TradesResponse | null): number {
  if (!trades?.rounds?.length) return 0;
  return trades.rounds.reduce(
    (sum, round) =>
      sum + round.trades.filter((trade) => trade.status === 'PENDING').length,
    0,
  );
}

function countPokemon(tiers: LeagueTier[]): number {
  return tiers.reduce((sum, tier) => sum + (tier.pokemon?.length ?? 0), 0);
}

function summariseSchedule(
  schedule: ScheduleResponse | null,
): ArtifactState['schedule'] {
  if (!schedule?.rounds?.length) {
    return { stageCount: 0, roundCount: 0, matchupCount: 0 };
  }
  const stages = new Set<string>();
  let matchupCount = 0;
  for (const round of schedule.rounds) {
    for (const stage of round.stages ?? []) {
      stages.add(stage.slug);
      matchupCount += stage.matchups?.length ?? 0;
    }
  }
  return {
    stageCount: stages.size,
    roundCount: schedule.rounds.length,
    matchupCount,
  };
}

function optional<T>(source: Observable<T>): Observable<T | null> {
  return source.pipe(catchError(() => of(null)));
}

export type { PrizeShare, TierRequirement };

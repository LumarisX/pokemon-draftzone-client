import { Injectable, computed, signal } from '@angular/core';
import {
  ArtifactState,
  Lifecycle,
  SETTINGS_NODES,
  SettingsSectionId,
  SettingsValue,
  launchChecklist,
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

  format: 'Champions M-B',
  ruleset: 'Champions Reg M-B',
  draftOrder: 'snake',
  draftPickTimerEnabled: true,
  draftPickTimerMinutes: 60,
  draftStart: '2026-10-10T18:00',
  draftEnd: '2026-10-12T22:00',
  draftCountMin: 11,
  draftCountMax: 12,
  pointTotalEnabled: true,
  pointTotal: 200,
  tierRules: [
    { tierName: 'A Tier', required: 1, max: 2 },
    { tierName: 'B Tier', required: 2, max: null },
    { tierName: 'C Tier', required: 2, max: null },
    { tierName: 'D Tier', required: 2, max: null },
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
    pokemonCount: 412,
    tierCount: 4,
    source: 'custom',
  },
  schedule: { stageCount: 2, roundCount: 11, matchupCount: 66 },
};

export const BLANK_ARTIFACTS: ArtifactState = {
  tierList: { name: null, pokemonCount: 0, tierCount: 0, source: null },
  schedule: { stageCount: 0, roundCount: 0, matchupCount: 0 },
};

export const BLANK_SETTINGS: SettingsValue = {
  ...MOCK_SETTINGS,
  name: '',
  description: '',
  discord: '',
  signUpDeadline: '',
  format: '',
  ruleset: '',
  draftStart: '',
  draftEnd: '',
  seasonStart: '',
  seasonEnd: '',
  tierRules: [],
  prizeSplit: [],
  adAdvertise: false,
};

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

@Injectable()
export class SettingsWorkbenchStore {
  private readonly savedValue = signal<SettingsValue>(MOCK_SETTINGS);
  private readonly draftValue = signal<SettingsValue>(MOCK_SETTINGS);
  private readonly artifactState = signal<ArtifactState>(MOCK_ARTIFACTS);

  readonly artifacts = this.artifactState.asReadonly();

  readonly phase = signal<Lifecycle>('setup');
  readonly query = signal('');

  readonly saved = this.savedValue.asReadonly();
  readonly draft = this.draftValue.asReadonly();

  readonly dirtyKeys = computed(() => {
    const saved = this.savedValue();
    const draft = this.draftValue();
    return (Object.keys(draft) as (keyof SettingsValue)[]).filter(
      (key) => !equal(saved[key], draft[key]),
    );
  });

  readonly errors = computed(() => settingsErrors(this.draftValue()));

  readonly checklist = computed(() =>
    launchChecklist({
      value: this.draftValue(),
      artifacts: this.artifactState(),
    }),
  );

  readonly visibleNodes = computed(() => {
    const value = this.draftValue();
    const query = this.query().trim().toLowerCase();

    return SETTINGS_NODES.filter((node) => {
      if (node.showWhen && !node.showWhen(value)) return false;
      if (!query) return true;
      const haystack = [
        node.title,
        node.help ?? '',
        ...node.controls.map((control) =>
          control.kind === 'custom'
            ? (control.label ?? control.slot)
            : control.label,
        ),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  });

  read<T>(key: keyof SettingsValue): T {
    return this.draftValue()[key] as T;
  }

  write(key: keyof SettingsValue, value: unknown): void {
    this.draftValue.update((current) => ({ ...current, [key]: value }));
  }

  errorFor(nodeId: string): string | null {
    return this.errors().find((entry) => entry.nodeId === nodeId)?.message ?? null;
  }

  sectionDirtyKeys(section: SettingsSectionId): (keyof SettingsValue)[] {
    const keys = new Set(sectionKeys(section));
    return this.dirtyKeys().filter((key) => keys.has(key));
  }

  sectionHasErrors(section: SettingsSectionId): boolean {
    return this.errors().some((entry) =>
      SETTINGS_NODES.some(
        (node) => node.id === entry.nodeId && node.section === section,
      ),
    );
  }

  saveSection(section: SettingsSectionId): void {
    const draft = this.draftValue();
    this.savedValue.update((current) => {
      const next = { ...current };
      for (const key of sectionKeys(section)) {
        (next as Record<string, unknown>)[key] = draft[key];
      }
      return next;
    });
  }

  revertSection(section: SettingsSectionId): void {
    const saved = this.savedValue();
    this.draftValue.update((current) => {
      const next = { ...current };
      for (const key of sectionKeys(section)) {
        (next as Record<string, unknown>)[key] = saved[key];
      }
      return next;
    });
  }

  reset(value: SettingsValue, artifacts: ArtifactState): void {
    this.savedValue.set(value);
    this.draftValue.set(value);
    this.artifactState.set(artifacts);
  }
}

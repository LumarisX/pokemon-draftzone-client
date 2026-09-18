export type Lifecycle = 'setup' | 'signups' | 'draft' | 'season' | 'complete';

export type Milestone = Exclude<Lifecycle, 'setup' | 'complete'>;

export const LIFECYCLE_ORDER: readonly Lifecycle[] = [
  'setup',
  'signups',
  'draft',
  'season',
  'complete',
];

export const MILESTONE_LABELS: Record<Milestone, string> = {
  signups: 'Before you open sign-ups',
  draft: 'Before the draft',
  season: 'Before the season starts',
};

export type SettingsSectionId =
  | 'identity'
  | 'signup'
  | 'draft'
  | 'season'
  | 'integrations';

export interface RiskSpec {
  from: Lifecycle;
  effect: 'warn' | 'block';
  because: string;
}

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  blurb: string;
  risk?: RiskSpec;
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: 'identity',
    label: 'Identity',
    blurb: 'What this tournament is called and where coaches gather.',
  },
  {
    id: 'signup',
    label: 'Sign-Ups',
    blurb: 'Who can join, and by when.',
    risk: {
      from: 'draft',
      effect: 'warn',
      because: 'Sign-ups have closed and teams are already drafting.',
    },
  },
  {
    id: 'draft',
    label: 'The Draft',
    blurb: 'How teams get their Pokémon.',
    risk: {
      from: 'draft',
      effect: 'block',
      because:
        'Changes apply immediately to teams that have already drafted. Costs, tiers and legality are recalculated from the current list, so rosters that were legal may no longer be. Review every team after saving.',
    },
  },
  {
    id: 'season',
    label: 'The Season',
    blurb: 'How matches are played, scored and recorded.',
    risk: {
      from: 'season',
      effect: 'warn',
      because:
        'The season is live and standings are published. Changes apply to results already recorded, so review the standings after saving.',
    },
  },
  {
    id: 'integrations',
    label: 'Integrations',
    blurb: 'Discord wiring. Nothing here changes how the tournament plays.',
  },
];

export interface TierRule {
  tierName: string;
  required: number;
  max: number | null;
}

export interface PrizeShare {
  place: number;
  percent: number;
}

export interface SettingsValue {
  name: string;
  description: string;
  logo: string | null;
  discord: string;

  signUpDeadline: string;

  format: string;
  ruleset: string;
  draftOrder: 'snake' | 'linear' | 'manual';
  draftPickTimerEnabled: boolean;
  draftPickTimerMinutes: number;
  draftStart: string;
  draftEnd: string;
  draftCountMin: number;
  draftCountMax: number;
  pointTotalEnabled: boolean;
  pointTotal: number;
  tierRules: TierRule[];
  tradePointLimitEnabled: boolean;
  tradePointLimit: number;

  seasonStart: string;
  seasonEnd: string;
  diffMode: 'pokemon' | 'game';
  forfeitGameDiff: number;
  forfeitPokemonDiff: number;
  matchupChat: boolean;
  coachReporting: boolean;

  discordGuildId: string;
  discordCoachRoleId: string;
  discordSignUpChannelId: string;

  adAdvertise: boolean;
  adSkillFrom: string;
  adSkillTo: string;
  adPrizeValue: string;
  adPlatforms: string[];
  prizeSplit: PrizeShare[];

  archived: boolean;
}

type KeysOfType<T> = {
  [K in keyof SettingsValue]: SettingsValue[K] extends T ? K : never;
}[keyof SettingsValue];

export type ChoiceOption = { value: string; label: string };

export type CustomSlot =
  | 'logo'
  | 'format-ruleset'
  | 'tier-rules'
  | 'prize-split'
  | 'discord-channels';

type ControlBase = { showWhen?: (value: SettingsValue) => boolean };

export type ControlSpec = ControlBase &
  (
    | {
      kind: 'text';
      key: KeysOfType<string>;
      label: string;
      placeholder?: string;
      maxLength?: number;
      required?: boolean;
    }
  | {
      kind: 'textarea';
      key: KeysOfType<string>;
      label: string;
      rows?: number;
    }
  | {
      kind: 'number';
      key: KeysOfType<number>;
      label: string;
      min?: number;
      max?: number;
      unit?: string;
    }
  | { kind: 'toggle'; key: KeysOfType<boolean>; label: string }
  | {
      kind: 'choice';
      key: KeysOfType<string>;
      label: string;
      options: readonly ChoiceOption[];
      as: 'radio' | 'select';
    }
  | {
      kind: 'datetime';
      key: KeysOfType<string>;
      label: string;
      required?: boolean;
    }
  | {
      kind: 'tags';
      key: KeysOfType<string[]>;
      label: string;
      options: readonly ChoiceOption[];
    }
    | {
        kind: 'custom';
        slot: CustomSlot;
        label?: string;
        keys: readonly (keyof SettingsValue)[];
      }
  );

export function controlKeys(
  control: ControlSpec,
): readonly (keyof SettingsValue)[] {
  return control.kind === 'custom' ? control.keys : [control.key];
}

export function nodeKeys(node: SettingsNode): (keyof SettingsValue)[] {
  return node.controls.flatMap((control) => [...controlKeys(control)]);
}

export function sectionKeys(
  section: SettingsSectionId,
): (keyof SettingsValue)[] {
  return SETTINGS_NODES.filter((node) => node.section === section).flatMap(
    nodeKeys,
  );
}

export type ArtifactSlot = 'tier-list' | 'schedule';

export interface TierListState {
  name: string | null;
  pokemonCount: number;
  tierCount: number;
  source: 'template' | 'custom' | null;
}

export interface ScheduleState {
  stageCount: number;
  roundCount: number;
  matchupCount: number;
}

export interface ArtifactState {
  tierList: TierListState;
  schedule: ScheduleState;
}

export interface SettingsContext {
  value: SettingsValue;
  artifacts: ArtifactState;
}

export interface LaunchStep {
  milestone: Milestone;
  label: string;
  done: (context: SettingsContext) => boolean;
}

export interface SettingsNode {
  id: string;
  section: SettingsSectionId;
  title: string;
  help?: string;
  artifact?: ArtifactSlot;
  controls: readonly ControlSpec[];
  showWhen?: (value: SettingsValue) => boolean;
  validate?: (value: SettingsValue) => string | null;
  launchStep?: LaunchStep;
}

const DRAFT_ORDERS: readonly ChoiceOption[] = [
  { value: 'snake', label: 'Snake' },
  { value: 'linear', label: 'Linear' },
  { value: 'manual', label: 'Set by organizers' },
];

const DIFF_MODES: readonly ChoiceOption[] = [
  { value: 'pokemon', label: 'Pokémon differential' },
  { value: 'game', label: 'Game differential' },
];

const SKILL_LEVELS: readonly ChoiceOption[] = [
  { value: '0', label: 'Novice' },
  { value: '1', label: 'Intermediate' },
  { value: '2', label: 'Advanced' },
  { value: '3', label: 'Expert' },
];

const PRIZE_VALUES: readonly ChoiceOption[] = [
  { value: '0', label: 'None' },
  { value: '1', label: 'Small (< $25)' },
  { value: '2', label: 'Medium ($25–$100)' },
  { value: '3', label: 'Large (> $100)' },
];

const AD_PLATFORMS: readonly ChoiceOption[] = [
  { value: 'Pokémon Showdown', label: 'Pokémon Showdown' },
  { value: 'Pokémon Champions', label: 'Pokémon Champions' },
  { value: 'Scarlet/Violet', label: 'Scarlet/Violet' },
];

export const SETTINGS_NODES: readonly SettingsNode[] = [
  {
    id: 'identity.name',
    section: 'identity',
    title: 'Name & description',
    controls: [
      {
        kind: 'text',
        key: 'name',
        label: 'Tournament name',
        maxLength: 120,
        required: true,
      },
      { kind: 'textarea', key: 'description', label: 'Description', rows: 3 },
    ],
    launchStep: {
      milestone: 'signups',
      label: 'Name your tournament',
      done: (c) => c.value.name.trim().length > 0,
    },
  },
  {
    id: 'identity.logo',
    section: 'identity',
    title: 'Logo',
    controls: [{ kind: 'custom', slot: 'logo', label: 'Tournament logo', keys: ['logo'] }],
  },
  {
    id: 'identity.discord',
    section: 'identity',
    title: 'Discord server',
    help: 'Coaches see this as a join link.',
    controls: [
      {
        kind: 'text',
        key: 'discord',
        label: 'Invite link',
        placeholder: 'https://discord.gg/…',
      },
    ],
    launchStep: {
      milestone: 'signups',
      label: 'Add a Discord invite',
      done: (c) => c.value.discord.trim().length > 0,
    },
  },

  {
    id: 'signup.deadline',
    section: 'signup',
    title: 'Sign-up deadline',
    controls: [
      {
        kind: 'datetime',
        key: 'signUpDeadline',
        label: 'Closes at',
        required: true,
      },
    ],
    launchStep: {
      milestone: 'signups',
      label: 'Set a sign-up deadline',
      done: (c) => c.value.signUpDeadline.trim().length > 0,
    },
  },

  {
    id: 'signup.listing',
    section: 'signup',
    title: 'Find a League listing',
    help: 'Advertises this tournament publicly until the sign-up deadline passes.',
    controls: [
      { kind: 'toggle', key: 'adAdvertise', label: 'List this tournament publicly' },
      {
        kind: 'choice',
        key: 'adSkillFrom',
        label: 'Skill level from',
        options: SKILL_LEVELS,
        as: 'select',
        showWhen: (v) => v.adAdvertise,
      },
      {
        kind: 'choice',
        key: 'adSkillTo',
        label: 'Skill level to',
        options: SKILL_LEVELS,
        as: 'select',
        showWhen: (v) => v.adAdvertise,
      },
      {
        kind: 'choice',
        key: 'adPrizeValue',
        label: 'Prize value',
        options: PRIZE_VALUES,
        as: 'select',
        showWhen: (v) => v.adAdvertise,
      },
      {
        kind: 'tags',
        key: 'adPlatforms',
        label: 'Platforms',
        options: AD_PLATFORMS,
        showWhen: (v) => v.adAdvertise,
      },
    ],
  },
  {
    id: 'draft.format',
    section: 'draft',
    title: 'Format & ruleset',
    help: 'Drives which Pokémon are legal to draft.',
    controls: [
      {
        kind: 'custom',
        slot: 'format-ruleset',
        keys: ['format', 'ruleset'],
      },
    ],
    launchStep: {
      milestone: 'signups',
      label: 'Choose a format',
      done: (c) => c.value.format.trim().length > 0 && c.value.ruleset.trim().length > 0,
    },
  },
  {
    id: 'draft.roster',
    section: 'draft',
    title: 'Roster size & budget',
    controls: [
      { kind: 'number', key: 'draftCountMin', label: 'Minimum roster', min: 1 },
      { kind: 'number', key: 'draftCountMax', label: 'Maximum roster', min: 1 },
      {
        kind: 'toggle',
        key: 'pointTotalEnabled',
        label: 'Give each team a point budget',
      },
      {
        kind: 'number',
        key: 'pointTotal',
        label: 'Points per team',
        min: 0,
        unit: 'points',
        showWhen: (v) => v.pointTotalEnabled,
      },
    ],
    validate: (v) =>
      v.draftCountMin > v.draftCountMax
        ? 'Minimum roster size cannot exceed the maximum.'
        : null,
    launchStep: {
      milestone: 'signups',
      label: 'Set roster size and budget',
      done: (c) => c.value.draftCountMax > 0,
    },
  },
  {
    id: 'draft.tiers',
    section: 'draft',
    title: 'Tier list',
    help: 'What each Pokémon costs, and the minimums and caps per tier.',
    artifact: 'tier-list',
    controls: [{ kind: 'custom', slot: 'tier-rules', keys: ['tierRules'] }],
    validate: (v) => {
      const required = v.tierRules.reduce((sum, tier) => sum + tier.required, 0);
      if (required > v.draftCountMax) {
        return `Required tier picks (${required}) exceed the maximum roster size (${v.draftCountMax}).`;
      }
      const overCapped = v.tierRules.find(
        (tier) => tier.max !== null && tier.required > tier.max,
      );
      return overCapped
        ? `${overCapped.tierName} requires more picks than its own limit allows.`
        : null;
    },
    launchStep: {
      milestone: 'signups',
      label: 'Choose or build a tier list',
      done: (c) => c.artifacts.tierList.name !== null,
    },
  },
  {
    id: 'draft.order',
    section: 'draft',
    title: 'Draft order',
    controls: [
      {
        kind: 'choice',
        key: 'draftOrder',
        label: 'Pick order',
        options: DRAFT_ORDERS,
        as: 'radio',
      },
    ],
    launchStep: {
      milestone: 'draft',
      label: 'Choose a draft order',
      done: (c) => c.value.draftOrder.length > 0,
    },
  },
  {
    id: 'draft.timer',
    section: 'draft',
    title: 'Pick timer',
    help: 'A missed pick moves to the end of the round rather than stacking.',
    controls: [
      { kind: 'toggle', key: 'draftPickTimerEnabled', label: 'Time each pick' },
      {
        kind: 'number',
        key: 'draftPickTimerMinutes',
        label: 'Minutes per pick',
        min: 1,
        unit: 'min',
        showWhen: (v) => v.draftPickTimerEnabled,
      },
    ],
    showWhen: (v) => v.draftOrder !== 'manual',
  },
  {
    id: 'draft.window',
    section: 'draft',
    title: 'Draft window',
    controls: [
      { kind: 'datetime', key: 'draftStart', label: 'Draft opens' },
      { kind: 'datetime', key: 'draftEnd', label: 'Draft closes' },
    ],
    launchStep: {
      milestone: 'draft',
      label: 'Schedule the draft',
      done: (c) => c.value.draftStart.trim().length > 0,
    },
  },
  {
    id: 'draft.trades',
    section: 'draft',
    title: 'Trades',
    controls: [
      {
        kind: 'toggle',
        key: 'tradePointLimitEnabled',
        label: 'Limit trade points',
      },
      {
        kind: 'number',
        key: 'tradePointLimit',
        label: 'Trade point limit',
        min: 0,
        unit: 'points',
        showWhen: (v) => v.tradePointLimitEnabled,
      },
    ],
  },

  {
    id: 'season.schedule',
    section: 'season',
    title: 'Stages & schedule',
    help: 'The stages, rounds and matchups teams actually play.',
    artifact: 'schedule',
    controls: [],
    launchStep: {
      milestone: 'season',
      label: 'Build the schedule',
      done: (c) => c.artifacts.schedule.matchupCount > 0,
    },
  },
  {
    id: 'season.window',
    section: 'season',
    title: 'Season window',
    controls: [
      { kind: 'datetime', key: 'seasonStart', label: 'Season starts' },
      { kind: 'datetime', key: 'seasonEnd', label: 'Season ends' },
    ],
    launchStep: {
      milestone: 'season',
      label: 'Set the season window',
      done: (c) => c.value.seasonStart.trim().length > 0,
    },
  },
  {
    id: 'season.scoring',
    section: 'season',
    title: 'Scoring',
    controls: [
      {
        kind: 'choice',
        key: 'diffMode',
        label: 'Tiebreak differential',
        options: DIFF_MODES,
        as: 'radio',
      },
    ],
    launchStep: {
      milestone: 'season',
      label: 'Choose how ties are broken',
      done: (c) => c.value.diffMode.length > 0,
    },
  },
  {
    id: 'season.forfeits',
    section: 'season',
    title: 'Forfeits',
    help: 'The score recorded when a match is not played.',
    controls: [
      { kind: 'number', key: 'forfeitGameDiff', label: 'Game differential', min: 0 },
      {
        kind: 'number',
        key: 'forfeitPokemonDiff',
        label: 'Pokémon differential',
        min: 0,
      },
    ],
  },
  {
    id: 'season.reporting',
    section: 'season',
    title: 'Match pages',
    controls: [
      {
        kind: 'toggle',
        key: 'coachReporting',
        label: 'Coaches submit their own results',
      },
      { kind: 'toggle', key: 'matchupChat', label: 'Enable matchup chat' },
    ],
  },
  {
    id: 'season.prizes',
    section: 'season',
    title: 'Prize split',
    controls: [{ kind: 'custom', slot: 'prize-split', keys: ['prizeSplit'] }],
    validate: (v) => {
      if (!v.prizeSplit.length) return null;
      const total = v.prizeSplit.reduce((sum, share) => sum + share.percent, 0);
      return total === 100 ? null : `Prize shares total ${total}%, not 100%.`;
    },
  },

  {
    id: 'integrations.discord',
    section: 'integrations',
    title: 'Discord bot',
    controls: [
      { kind: 'text', key: 'discordGuildId', label: 'Server ID' },
      { kind: 'text', key: 'discordCoachRoleId', label: 'Coach role ID' },
      {
        kind: 'custom',
        slot: 'discord-channels',
        keys: ['discordSignUpChannelId'],
      },
    ],
  },

];

export function nodesForSection(section: SettingsSectionId): SettingsNode[] {
  return SETTINGS_NODES.filter((node) => node.section === section);
}

export function lifecycleReached(current: Lifecycle, from: Lifecycle): boolean {
  return LIFECYCLE_ORDER.indexOf(current) >= LIFECYCLE_ORDER.indexOf(from);
}

export function sectionRisk(
  section: SettingsSection,
  phase: Lifecycle,
): RiskSpec | null {
  if (!section.risk) return null;
  return lifecycleReached(phase, section.risk.from) ? section.risk : null;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
  nodeId: string;
  section: SettingsSectionId;
}

export interface ChecklistGroup {
  milestone: Milestone;
  label: string;
  items: ChecklistItem[];
  complete: boolean;
}

export function launchChecklist(context: SettingsContext): ChecklistGroup[] {
  const milestones: Milestone[] = ['signups', 'draft', 'season'];

  return milestones
    .map((milestone) => {
      const items: ChecklistItem[] = SETTINGS_NODES.filter(
        (node) => node.launchStep?.milestone === milestone,
      ).map((node) => ({
        label: node.launchStep!.label,
        done: node.launchStep!.done(context),
        nodeId: node.id,
        section: node.section,
      }));

      return {
        milestone,
        label: MILESTONE_LABELS[milestone],
        items,
        complete: items.every((item) => item.done),
      };
    })
    .filter((group) => group.items.length > 0);
}

export function settingsErrors(value: SettingsValue) {
  return SETTINGS_NODES.flatMap((node) => {
    if (node.showWhen && !node.showWhen(value)) return [];
    const message = node.validate?.(value);
    return message ? [{ nodeId: node.id, message }] : [];
  });
}

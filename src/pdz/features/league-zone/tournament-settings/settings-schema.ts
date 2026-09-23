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
  path: string;
  label: string;
  blurb: string;
  icon: string;
  risk?: RiskSpec;
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: 'identity',
    path: 'identity',
    label: 'Identity',
    blurb: 'What this tournament is called, how it looks, and its rules.',
    icon: 'badge',
  },
  {
    id: 'signup',
    path: 'sign-ups',
    label: 'Sign-Ups',
    blurb: 'Who can join, and by when.',
    icon: 'how_to_reg',
    risk: {
      from: 'draft',
      effect: 'warn',
      because: 'Sign-ups have closed and teams are already drafting.',
    },
  },
  {
    id: 'draft',
    path: 'draft',
    label: 'The Draft',
    blurb: 'Roster rules, the tier list, and every draft pool.',
    icon: 'format_list_numbered',
    risk: {
      from: 'draft',
      effect: 'block',
      because:
        'Changes apply immediately to teams that have already drafted. Costs, tiers and legality are recalculated from the current list, so rosters that were legal may no longer be. Review every team after saving.',
    },
  },
  {
    id: 'season',
    path: 'season',
    label: 'The Season',
    blurb: 'How matches are played, scored and recorded.',
    icon: 'calendar_month',
    risk: {
      from: 'season',
      effect: 'warn',
      because:
        'The season is live and standings are published. Changes apply to results already recorded, so review the standings after saving.',
    },
  },
  {
    id: 'integrations',
    path: 'integrations',
    label: 'Integrations',
    blurb: 'Your Discord server and the bot that posts to it.',
    icon: 'hub',
  },
];

export function sectionById(id: SettingsSectionId): SettingsSection {
  return SETTINGS_SECTIONS.find((section) => section.id === id)!;
}

export interface TierRequirement {
  tierId: string;
  required: number;
  max: number | null;
}

export type SignUpQuestionType =
  | 'short'
  | 'long'
  | 'choice'
  | 'multi'
  | 'boolean';

export const SIGNUP_QUESTION_TYPE_OPTIONS: readonly ChoiceOption[] = [
  { value: 'short', label: 'Short text' },
  { value: 'long', label: 'Long text' },
  { value: 'choice', label: 'Pick one' },
  { value: 'multi', label: 'Pick many' },
  { value: 'boolean', label: 'Yes / no' },
];

export interface SignUpQuestionValue {
  id: string;
  label: string;
  help: string;
  type: SignUpQuestionType;
  options: string[];
  required: boolean;
  maxLength: number | null;
  dependsOnQuestionId: string | null;
  dependsOnEquals: string;
  archived: boolean;
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
  signUpAccess: 'open' | 'invite' | 'closed';
  signUpQuestions: SignUpQuestionValue[];
  maxTeamsEnabled: boolean;
  maxTeams: number;

  draftCountMin: number;
  draftCountMax: number;
  pointTotalEnabled: boolean;
  pointTotal: number;
  tierRequirements: TierRequirement[];
  tradePointLimitEnabled: boolean;
  tradePointLimit: number;

  draftStart: string;
  draftEnd: string;

  seasonStart: string;
  seasonEnd: string;
  diffMode: 'pokemon' | 'game';
  forfeitGameDiff: number;
  forfeitPokemonDiff: number;
  matchupChat: boolean;
  coachReporting: boolean;

  discordGuildId: string;
  discordCoachRoleId: string;
  discordAutoGrantCoachRole: boolean;
  discordSignUpChannelId: string;

  adAdvertise: boolean;
  adSkillFrom: string;
  adSkillTo: string;
  adPrizeValue: string;
  adPlatforms: string[];
  prizeSplit: PrizeShare[];

  archived: boolean;
}

export type OrderProgression = 'snake' | 'linear';

export type PoolVisibility = 'ALL' | 'SELF';

export type DraftStatus = 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

export function draftNotStarted(status: DraftStatus): boolean {
  return !['IN_PROGRESS', 'PAUSED', 'COMPLETED'].includes(status);
}

export type SignUpStatus =
  | 'approved'
  | 'pending'
  | 'waitlisted'
  | 'denied'
  | 'dropped';

export const SIGNUP_STATUSES: readonly SignUpStatus[] = [
  'pending',
  'waitlisted',
  'approved',
  'denied',
  'dropped',
];

export const SIGNUP_STATUS_LABELS: Record<SignUpStatus, string> = {
  pending: 'Pending',
  waitlisted: 'Waitlisted',
  approved: 'Approved',
  denied: 'Denied',
  dropped: 'Dropped',
};

export const DECIDABLE_STATUSES: readonly SignUpStatus[] = [
  'pending',
  'waitlisted',
  'approved',
  'denied',
];

export const TEAM_STATUSES: readonly SignUpStatus[] = ['approved', 'dropped'];

export interface SignUpAnswerValue {
  questionId: string;
  label: string;
  values: string[];
}

export interface SignUpValue {
  id: string | null;
  applicationId: string;
  intent: 'team' | 'sub';
  answers: SignUpAnswerValue[];
  teamId: string | null;
  teamSlug: string | null;
  logo: string | null;
  status: SignUpStatus;
  teamName: string;
  coach: string;
  showdownName: string;
  discordName: string;
  timezone: string;
  experience: string;
  signedUpAt: string;
  inDiscordServer: boolean;
  hasDiscordRole: boolean;
}

export interface DraftPoolValue {
  id: string;
  name: string;
  slug: string;
  channelId: string;
  status: DraftStatus;
  draftStart: string;
  draftEnd: string;
  orderProgression: OrderProgression;
  sequentialTurns: boolean;
  pickTimerEnabled: boolean;
  pickTimerMinutes: number;
  useRandomSeeding: boolean;
  visibility: PoolVisibility;
  allowRemovals: boolean;
  teams: string[];
}

export type ValueBag = SettingsValue | DraftPoolValue;

type KeysOfType<V, T> = {
  [K in keyof V]: V[K] extends T ? K : never;
}[keyof V];

export type ChoiceOption = { value: string; label: string };

export type CustomSlot =
  | 'logo'
  | 'tier-requirements'
  | 'prize-split'
  | 'discord-channels'
  | 'invite-link'
  | 'signup-questions'
  | 'pool-channel'
  | 'pool-window'
  | 'pool-order';

export type ControlSpecFor<V> = { showWhen?: (value: V) => boolean } & (
  | {
      kind: 'text';
      key: KeysOfType<V, string>;
      label: string;
      placeholder?: string;
      maxLength?: number;
      required?: boolean;
    }
  | {
      kind: 'textarea';
      key: KeysOfType<V, string>;
      label: string;
      rows?: number;
    }
  | {
      kind: 'number';
      key: KeysOfType<V, number>;
      label: string;
      min?: number;
      max?: number;
      unit?: string;
    }
  | { kind: 'toggle'; key: KeysOfType<V, boolean>; label: string }
  | {
      kind: 'choice';
      key: KeysOfType<V, string>;
      label: string;
      options: readonly ChoiceOption[];
      as: 'radio' | 'select';
    }
  | {
      kind: 'datetime';
      key: KeysOfType<V, string>;
      label: string;
      required?: boolean;
    }
  | {
      kind: 'tags';
      key: KeysOfType<V, string[]>;
      label: string;
      options: readonly ChoiceOption[];
    }
  | {
      kind: 'custom';
      slot: CustomSlot;
      label?: string;
      keys: readonly (keyof V)[];
    }
);

export type ControlSpec = ControlSpecFor<SettingsValue>;
export type PoolControlSpec = ControlSpecFor<DraftPoolValue>;
export type AnyControlSpec = ControlSpecFor<SettingsValue & DraftPoolValue>;

export function controlVisible(
  control: AnyControlSpec,
  bag: ValueBag,
): boolean {
  if (!control.showWhen) return true;
  return control.showWhen(bag as SettingsValue & DraftPoolValue);
}

export function controlKeys(control: AnyControlSpec): readonly string[] {
  return control.kind === 'custom'
    ? (control.keys as readonly string[])
    : [control.key as string];
}

export interface NodeFor<V> {
  id: string;
  title: string;
  help?: string;
  controls: readonly ControlSpecFor<V>[];
  showWhen?: (value: V) => boolean;
  validate?: (value: V) => string | null;
}

export type ArtifactSlot = 'tier-list' | 'schedule' | 'rules';

export interface SettingsNode extends NodeFor<SettingsValue> {
  section: SettingsSectionId;
  artifact?: ArtifactSlot;
  requiresTierList?: boolean;
}

export const TIER_LIST_GATE_REASON =
  'Attach a tier list first — it sets the format, the ruleset and the tiers.';

export interface PoolNode extends NodeFor<DraftPoolValue> {
  span?: 'full';
}

export type AnyNode = NodeFor<SettingsValue & DraftPoolValue>;

export function nodeVisible(node: AnyNode, bag: ValueBag): boolean {
  if (!node.showWhen) return true;
  return node.showWhen(bag as SettingsValue & DraftPoolValue);
}

export function nodeError(node: AnyNode, bag: ValueBag): string | null {
  if (!node.validate) return null;
  return node.validate(bag as SettingsValue & DraftPoolValue);
}

export function nodeKeys(node: AnyNode): string[] {
  return node.controls.flatMap((control) => [
    ...controlKeys(control as AnyControlSpec),
  ]);
}

export interface TierSummary {
  id: string;
  name: string;
  cost: number;
  color: string;
}

export interface TierListState {
  name: string | null;
  slug: string | null;
  format: string;
  ruleset: string;
  pokemonCount: number;
  tiers: TierSummary[];
  source: 'template' | 'custom' | null;
}

export interface ScheduleState {
  stageCount: number;
  roundCount: number;
  matchupCount: number;
}

export interface RulesState {
  sectionCount: number;
  wordCount: number;
}

export interface ArtifactState {
  tierList: TierListState;
  schedule: ScheduleState;
  rules: RulesState;
}

export interface SettingsContext {
  value: SettingsValue;
  pools: DraftPoolValue[];
  signUps: SignUpValue[];
  unassigned: SignUpValue[];
  artifacts: ArtifactState;
}

const DRAFT_ORDERS: readonly ChoiceOption[] = [
  { value: 'snake', label: 'Snake' },
  { value: 'linear', label: 'Linear' },
];

const VISIBILITIES: readonly ChoiceOption[] = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'SELF', label: 'Coach only' },
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
  },
  {
    id: 'identity.logo',
    section: 'identity',
    title: 'Logo',
    controls: [
      { kind: 'custom', slot: 'logo', label: 'Tournament logo', keys: ['logo'] },
    ],
  },
  {
    id: 'identity.rules',
    section: 'identity',
    title: 'Rules',
    help: 'The regulations coaches read before they sign up.',
    artifact: 'rules',
    controls: [],
  },
  {
    id: 'identity.archived',
    section: 'identity',
    title: 'Archive',
    help: 'Archived tournaments stay readable but drop out of league listings.',
    controls: [
      { kind: 'toggle', key: 'archived', label: 'Archive this tournament' },
    ],
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
  },
  {
    id: 'signup.access',
    section: 'signup',
    title: 'Who can sign up',
    help: 'Invite-only hides nothing — it means only people with your link can apply. Everyone still lands as pending for you to approve.',
    controls: [
      {
        kind: 'choice',
        key: 'signUpAccess',
        label: 'Access',
        as: 'radio',
        options: [
          { value: 'open', label: 'Anyone can apply' },
          { value: 'invite', label: 'Invite link only' },
          { value: 'closed', label: 'Closed' },
        ],
      },
      {
        kind: 'custom',
        slot: 'invite-link',
        keys: ['signUpAccess'],
      },
    ],
  },
  {
    id: 'signup.questions',
    section: 'signup',
    title: 'Questions',
    help: 'Asked on the sign-up form on top of the built-in name, Showdown name, Discord, timezone and team name.',
    controls: [{ kind: 'custom', slot: 'signup-questions', keys: ['signUpQuestions'] }],
  },
  {
    id: 'signup.capacity',
    section: 'signup',
    title: 'Team limit',
    help: 'Caps how many teams you can approve. Sign-ups stay open past it so you can keep a waitlist.',
    controls: [
      { kind: 'toggle', key: 'maxTeamsEnabled', label: 'Limit the roster' },
      {
        kind: 'number',
        key: 'maxTeams',
        label: 'Maximum teams',
        min: 1,
        showWhen: (v) => v.maxTeamsEnabled,
      },
    ],
  },
  {
    id: 'signup.listing',
    section: 'signup',
    title: 'Find a League listing',
    help: 'Advertises this tournament publicly until the sign-up deadline passes.',
    controls: [
      {
        kind: 'toggle',
        key: 'adAdvertise',
        label: 'List this tournament publicly',
      },
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
    id: 'draft.roster',
    section: 'draft',
    title: 'Roster size & budget',
    help: 'Applies to every pool.',
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
  },
  {
    id: 'draft.tiers',
    section: 'draft',
    title: 'Tier list',
    help: 'Sets the format, what each Pokémon costs, and which are legal. Attaching one copies it, so later edits by its author never reprice a draft in progress.',
    controls: [
      { kind: 'custom', slot: 'tier-requirements', keys: ['tierRequirements'] },
    ],
  },
  {
    id: 'draft.trades',
    section: 'draft',
    title: 'Trades',
    requiresTierList: true,
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
    requiresTierList: true,
    controls: [],
  },
  {
    id: 'season.window',
    section: 'season',
    title: 'Season window',
    controls: [
      { kind: 'datetime', key: 'seasonStart', label: 'Season starts' },
      { kind: 'datetime', key: 'seasonEnd', label: 'Season ends' },
    ],
    validate: (v) =>
      v.seasonStart && v.seasonEnd && v.seasonEnd < v.seasonStart
        ? 'The season ends before it starts.'
        : null,
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
  },
  {
    id: 'season.forfeits',
    section: 'season',
    title: 'Forfeits',
    help: 'The score recorded when a match is not played.',
    controls: [
      {
        kind: 'number',
        key: 'forfeitGameDiff',
        label: 'Game differential',
        min: 0,
      },
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
    id: 'integrations.invite',
    section: 'integrations',
    title: 'Discord server',
    help: 'Coaches see this as a join link on the tournament page. It works whether or not the bot is connected.',
    controls: [
      {
        kind: 'text',
        key: 'discord',
        label: 'Invite link',
        placeholder: 'https://discord.gg/…',
      },
    ],
  },
  {
    id: 'integrations.discord',
    section: 'integrations',
    title: 'Discord bot',
    help: 'Lets DraftZone post picks, assign the coach role and mirror sign-ups.',
    controls: [
      { kind: 'text', key: 'discordGuildId', label: 'Server ID' },
      { kind: 'text', key: 'discordCoachRoleId', label: 'Coach role ID' },
      {
        kind: 'toggle',
        key: 'discordAutoGrantCoachRole',
        label: 'Grant the coach role on approval',
        showWhen: (v) => !!v.discordCoachRoleId,
      },
      {
        kind: 'custom',
        slot: 'discord-channels',
        keys: ['discordSignUpChannelId'],
      },
    ],
  },
];

export const POOL_NODES: readonly PoolNode[] = [
  {
    id: 'pool.name',
    title: 'Pool name',
    controls: [{ kind: 'text', key: 'name', label: 'Name', maxLength: 60 }],
  },
  {
    id: 'pool.channel',
    title: 'Discord channel',
    help: 'Picks and turn notifications post here.',
    controls: [{ kind: 'custom', slot: 'pool-channel', keys: ['channelId'] }],
  },
  {
    id: 'pool.window',
    title: 'Draft window',
    help: 'When this pool drafts. The tournament window follows the earliest open and latest close.',
    controls: [
      {
        kind: 'custom',
        slot: 'pool-window',
        keys: ['draftStart', 'draftEnd'],
      },
    ],
    validate: (pool) =>
      pool.draftStart && pool.draftEnd && pool.draftEnd < pool.draftStart
        ? 'This pool closes before it opens.'
        : null,
  },
  {
    id: 'pool.order',
    title: 'Turn order',
    controls: [
      {
        kind: 'choice',
        key: 'orderProgression',
        label: 'Progression',
        options: DRAFT_ORDERS,
        as: 'radio',
      },
      {
        kind: 'toggle',
        key: 'sequentialTurns',
        label: 'Sequential turns',
      },
    ],
  },
  {
    id: 'pool.timer',
    title: 'Pick timer',
    help: 'A missed pick moves to the end of the round rather than stacking.',
    controls: [
      { kind: 'toggle', key: 'pickTimerEnabled', label: 'Time each pick' },
      {
        kind: 'number',
        key: 'pickTimerMinutes',
        label: 'Minutes per pick',
        min: 1,
        unit: 'min',
        showWhen: (pool) => pool.pickTimerEnabled,
      },
    ],
  },
  {
    id: 'pool.access',
    title: 'Coach access',
    controls: [
      {
        kind: 'choice',
        key: 'visibility',
        label: 'Who sees the board',
        options: VISIBILITIES,
        as: 'radio',
      },
      {
        kind: 'toggle',
        key: 'allowRemovals',
        label: 'Allow pick removals',
      },
    ],
  },
  {
    id: 'pool.teams',
    title: 'Draft order',
    span: 'full',
    controls: [
      {
        kind: 'custom',
        slot: 'pool-order',
        keys: ['teams', 'useRandomSeeding'],
      },
    ],
  },
];

export function nodesForSection(section: SettingsSectionId): SettingsNode[] {
  return SETTINGS_NODES.filter((node) => node.section === section);
}

export function sectionKeys(section: SettingsSectionId): string[] {
  return nodesForSection(section).flatMap((node) => nodeKeys(node as AnyNode));
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

export interface LaunchStep {
  id: string;
  milestone: Milestone;
  label: string;
  section: SettingsSectionId;
  fragment: string;
  done: (context: SettingsContext) => boolean;
}

export const LAUNCH_STEPS: readonly LaunchStep[] = [
  {
    id: 'name',
    milestone: 'signups',
    label: 'Name your tournament',
    section: 'identity',
    fragment: 'identity.name',
    done: (c) => c.value.name.trim().length > 0,
  },
  {
    id: 'discord',
    milestone: 'signups',
    label: 'Add a Discord invite',
    section: 'integrations',
    fragment: 'integrations.invite',
    done: (c) => c.value.discord.trim().length > 0,
  },
  {
    id: 'deadline',
    milestone: 'signups',
    label: 'Set a sign-up deadline',
    section: 'signup',
    fragment: 'signup.deadline',
    done: (c) => c.value.signUpDeadline.trim().length > 0,
  },
  {
    id: 'roster',
    milestone: 'signups',
    label: 'Set roster size and budget',
    section: 'draft',
    fragment: 'draft.roster',
    done: (c) => c.value.draftCountMax > 0,
  },
  {
    id: 'tier-list',
    milestone: 'signups',
    label: 'Attach a tier list',
    section: 'draft',
    fragment: 'draft.tiers',
    done: (c) => c.artifacts.tierList.name !== null,
  },
  {
    id: 'review-signups',
    milestone: 'draft',
    label: 'Review every sign-up',
    section: 'signup',
    fragment: 'applicants',
    done: (c) => c.signUps.every((entry) => entry.status !== 'pending'),
  },
  {
    id: 'pool-teams',
    milestone: 'draft',
    label: 'Put every team in a pool',
    section: 'draft',
    fragment: 'pools',
    done: (c) =>
      c.unassigned.length === 0 && c.pools.every((pool) => pool.teams.length > 1),
  },
  {
    id: 'draft-window',
    milestone: 'draft',
    label: 'Schedule every pool',
    section: 'draft',
    fragment: 'pools',
    done: (c) =>
      c.pools.length > 0 &&
      c.pools.every((pool) => pool.draftStart.trim().length > 0),
  },
  {
    id: 'schedule',
    milestone: 'season',
    label: 'Build the schedule',
    section: 'season',
    fragment: 'season.schedule',
    done: (c) => c.artifacts.schedule.matchupCount > 0,
  },
  {
    id: 'season-window',
    milestone: 'season',
    label: 'Set the season window',
    section: 'season',
    fragment: 'season.window',
    done: (c) => c.value.seasonStart.trim().length > 0,
  },
  {
    id: 'scoring',
    milestone: 'season',
    label: 'Choose how ties are broken',
    section: 'season',
    fragment: 'season.scoring',
    done: (c) => c.value.diffMode.length > 0,
  },
];

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  section: SettingsSectionId;
  path: string;
  fragment: string;
}

export interface ChecklistGroup {
  milestone: Milestone;
  label: string;
  items: ChecklistItem[];
  complete: boolean;
}

export function launchChecklist(context: SettingsContext): ChecklistGroup[] {
  const milestones: Milestone[] = ['signups', 'draft', 'season'];

  return milestones.map((milestone) => {
    const items: ChecklistItem[] = LAUNCH_STEPS.filter(
      (step) => step.milestone === milestone,
    ).map((step) => ({
      id: step.id,
      label: step.label,
      done: step.done(context),
      section: step.section,
      path: sectionById(step.section).path,
      fragment: step.fragment,
    }));

    return {
      milestone,
      label: MILESTONE_LABELS[milestone],
      items,
      complete: items.every((item) => item.done),
    };
  });
}

export interface NodeIssue {
  nodeId: string;
  poolId: string | null;
  message: string;
}

export function settingsErrors(value: SettingsValue): NodeIssue[] {
  return SETTINGS_NODES.flatMap((node) => {
    if (!nodeVisible(node as AnyNode, value)) return [];
    const message = nodeError(node as AnyNode, value);
    return message ? [{ nodeId: node.id, poolId: null, message }] : [];
  });
}

export function poolErrors(pool: DraftPoolValue): NodeIssue[] {
  return POOL_NODES.flatMap((node) => {
    if (!nodeVisible(node as AnyNode, pool)) return [];
    const message = nodeError(node as AnyNode, pool);
    return message ? [{ nodeId: node.id, poolId: pool.id, message }] : [];
  });
}

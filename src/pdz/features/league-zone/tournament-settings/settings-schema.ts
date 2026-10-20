export type Tiebreaker =
  | 'headToHead'
  | 'gameDiff'
  | 'pokemonDiff'
  | 'strengthOfSchedule';

export const TIEBREAKER_OPTIONS: readonly {
  value: Tiebreaker;
  label: string;
  help: string;
}[] = [
  {
    value: 'headToHead',
    label: 'Head-to-Head',
    help: 'Points earned in matches between the tied teams.',
  },
  {
    value: 'gameDiff',
    label: 'Game Differential',
    help: 'Games won minus games lost.',
  },
  {
    value: 'pokemonDiff',
    label: 'Pokémon Differential',
    help: "Each game's winner's remaining Pokémon, plus for the winner and minus for the loser.",
  },
  {
    value: 'strengthOfSchedule',
    label: 'Strength of Schedule',
    help: 'Total points of every opponent faced.',
  },
];

export function defaultTiebreakers(diffMode: 'pokemon' | 'game'): Tiebreaker[] {
  return diffMode === 'game'
    ? ['gameDiff', 'pokemonDiff', 'headToHead']
    : ['pokemonDiff', 'gameDiff', 'headToHead'];
}

export function withEveryTiebreaker(order: Tiebreaker[]): Tiebreaker[] {
  return [
    ...order,
    ...TIEBREAKER_OPTIONS.map((option) => option.value).filter(
      (value) => !order.includes(value),
    ),
  ];
}

export type Lifecycle = 'setup' | 'signups' | 'draft' | 'season' | 'complete';

export const LIFECYCLE_ORDER: readonly Lifecycle[] = [
  'setup',
  'signups',
  'draft',
  'season',
  'complete',
];

export const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  setup: 'Setup',
  signups: 'Sign-Ups',
  draft: 'Draft',
  season: 'Season',
  complete: 'Complete',
};

export type SettingsSectionId =
  | 'general'
  | 'signup'
  | 'draft'
  | 'season'
  | 'discord';

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

export const DRAFT_RISK: RiskSpec = {
  from: 'draft',
  effect: 'block',
  because:
    'Changes apply immediately to teams that have already drafted. Costs, tiers and legality are recalculated from the current list, so rosters that were legal may no longer be. Review every team after saving.',
};

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  {
    id: 'general',
    label: 'General',
    blurb: 'What this tournament is called and how it looks.',
  },
  {
    id: 'signup',
    label: 'Sign-Ups',
    blurb: 'Who can join, by when, and what they are asked.',
    risk: {
      from: 'draft',
      effect: 'warn',
      because: 'Sign-ups have closed and teams are already drafting.',
    },
  },
  {
    id: 'draft',
    label: 'Draft',
    blurb: 'Roster rules and the tier list. They apply to every pool.',
    risk: DRAFT_RISK,
  },
  {
    id: 'season',
    label: 'Season',
    blurb: 'When matches are played, and how they are scored.',
    risk: {
      from: 'season',
      effect: 'warn',
      because:
        'The season is live and standings are published. Changes apply to results already recorded, so review the standings after saving.',
    },
  },
  {
    id: 'discord',
    label: 'Discord',
    blurb: 'Your server, and the bot that posts to it.',
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
  { value: 'short', label: 'Short Text' },
  { value: 'long', label: 'Long Text' },
  { value: 'choice', label: 'Pick One' },
  { value: 'multi', label: 'Pick Many' },
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
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  tiebreakers: Tiebreaker[];
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

  completed: boolean;
}

export type OrderProgression = 'snake' | 'linear';

export type PicksVisibleTo = 'everyone' | 'ownTeam';

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

export const TEAM_STATUSES: readonly SignUpStatus[] = ['approved', 'dropped'];

export interface SignUpAnswerValue {
  questionId: string;
  label: string;
  values: string[];
}

export type SignUpSeat = { kind: 'team'; pool: string | null } | { kind: 'sub' };

export type SignUpChoice = {
  key: string;
  label: string;
  disabled: boolean;
};

export function signUpChoices(pools: readonly DraftPoolValue[]): SignUpChoice[] {
  const seats: SignUpChoice[] = pools.length
    ? pools.map((pool) => ({
        key: `team:${pool.slug}`,
        label: `Add to ${pool.name}`,
        disabled: poolClosedToNewTeams(pool),
      }))
    : [{ key: 'team:', label: 'Add Team', disabled: false }];
  return [
    { key: 'pending', label: SIGNUP_STATUS_LABELS.pending, disabled: false },
    { key: 'waitlisted', label: SIGNUP_STATUS_LABELS.waitlisted, disabled: false },
    ...seats,
    { key: 'sub', label: 'Add as Sub', disabled: false },
    { key: 'denied', label: SIGNUP_STATUS_LABELS.denied, disabled: false },
  ];
}

export function poolClosedToNewTeams(pool: DraftPoolValue): boolean {
  return pool.sequentialTurns && !draftNotStarted(pool.status);
}

export function signUpChoiceKey(entry: SignUpValue): string {
  if (entry.seat?.kind === 'team') return `team:${entry.seat.pool ?? ''}`;
  if (entry.seat?.kind === 'sub') return 'sub';
  if (entry.status === 'approved' && !entry.teamId) return 'sub';
  return entry.status;
}

export function parseSignUpChoice(key: string): {
  status: SignUpStatus;
  seat: SignUpSeat | null;
} {
  if (key.startsWith('team:'))
    return { status: 'approved', seat: { kind: 'team', pool: key.slice(5) || null } };
  if (key === 'sub') return { status: 'approved', seat: { kind: 'sub' } };
  return { status: key as SignUpStatus, seat: null };
}

export interface SignUpValue {
  id: string | null;
  applicationId: string;
  intent: 'team' | 'sub';
  seat?: SignUpSeat | null;
  answers: SignUpAnswerValue[];
  teamId: string | null;
  teamSlug: string | null;
  logo: string | null;
  status: SignUpStatus;
  departed: boolean;
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
  picksVisibleTo: PicksVisibleTo;
  allowDuplicates: boolean;
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
  | 'tiebreakers'
  | 'discord-link'
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

export interface SettingsNode extends NodeFor<SettingsValue> {
  section: SettingsSectionId;
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
  playedCount: number;
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
  phase: Lifecycle;
}

const DRAFT_ORDERS: readonly ChoiceOption[] = [
  { value: 'snake', label: 'Snake' },
  { value: 'linear', label: 'Linear' },
];

const PICK_VISIBILITIES: readonly ChoiceOption[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'ownTeam', label: 'Own team only' },
];

const DIFF_MODES: readonly ChoiceOption[] = [
  { value: 'pokemon', label: 'Pokémon Differential' },
  { value: 'game', label: 'Game Differential' },
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
    id: 'general.name',
    section: 'general',
    title: 'Name & Description',
    controls: [
      {
        kind: 'text',
        key: 'name',
        label: 'Tournament Name',
        maxLength: 120,
        required: true,
      },
      { kind: 'textarea', key: 'description', label: 'Description', rows: 3 },
    ],
  },
  {
    id: 'general.logo',
    section: 'general',
    title: 'Logo',
    controls: [
      { kind: 'custom', slot: 'logo', label: 'Tournament Logo', keys: ['logo'] },
    ],
  },
  {
    id: 'signup.deadline',
    section: 'signup',
    title: 'Sign-Up Deadline',
    controls: [
      {
        kind: 'datetime',
        key: 'signUpDeadline',
        label: 'Closes At',
        required: true,
      },
    ],
  },
  {
    id: 'signup.access',
    section: 'signup',
    title: 'Who Can Sign Up',
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
    title: 'Team Limit',
    help: 'Caps how many teams you can approve. Sign-ups stay open past it so you can keep a waitlist.',
    controls: [
      { kind: 'toggle', key: 'maxTeamsEnabled', label: 'Limit the roster' },
      {
        kind: 'number',
        key: 'maxTeams',
        label: 'Maximum Teams',
        min: 1,
        showWhen: (v) => v.maxTeamsEnabled,
      },
    ],
  },
  {
    id: 'signup.listing',
    section: 'signup',
    title: 'Find a League Listing',
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
        label: 'Skill Level From',
        options: SKILL_LEVELS,
        as: 'select',
        showWhen: (v) => v.adAdvertise,
      },
      {
        kind: 'choice',
        key: 'adSkillTo',
        label: 'Skill Level To',
        options: SKILL_LEVELS,
        as: 'select',
        showWhen: (v) => v.adAdvertise,
      },
      {
        kind: 'choice',
        key: 'adPrizeValue',
        label: 'Prize Value',
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
    title: 'Roster Size & Budget',
    help: 'Applies to every pool.',
    controls: [
      { kind: 'number', key: 'draftCountMin', label: 'Minimum Roster', min: 1 },
      { kind: 'number', key: 'draftCountMax', label: 'Maximum Roster', min: 1 },
      {
        kind: 'toggle',
        key: 'pointTotalEnabled',
        label: 'Give each team a point budget',
      },
      {
        kind: 'number',
        key: 'pointTotal',
        label: 'Points per Team',
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
    title: 'Tier List',
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
        label: 'Trade Point Limit',
        min: 0,
        unit: 'points',
        showWhen: (v) => v.tradePointLimitEnabled,
      },
    ],
  },

  {
    id: 'season.window',
    section: 'season',
    title: 'Season Window',
    controls: [
      { kind: 'datetime', key: 'seasonStart', label: 'Season Starts' },
      { kind: 'datetime', key: 'seasonEnd', label: 'Season Ends' },
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
    help: 'Teams are ranked by points, then by each tiebreaker in order.',
    controls: [
      { kind: 'number', key: 'pointsWin', label: 'Points for a Win', min: 0, max: 10 },
      { kind: 'number', key: 'pointsDraw', label: 'Points for a Draw', min: 0, max: 10 },
      { kind: 'number', key: 'pointsLoss', label: 'Points for a Loss', min: 0, max: 10 },
      {
        kind: 'choice',
        key: 'diffMode',
        label: 'Differential Shown per Round',
        options: DIFF_MODES,
        as: 'radio',
      },
      {
        kind: 'custom',
        slot: 'tiebreakers',
        label: 'Tiebreakers',
        keys: ['tiebreakers'],
      },
    ],
    validate: (v) =>
      v.pointsLoss <= v.pointsDraw && v.pointsDraw <= v.pointsWin
        ? null
        : 'A loss cannot be worth more than a draw, or a draw more than a win.',
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
        label: 'Game Differential',
        min: 0,
      },
      {
        kind: 'number',
        key: 'forfeitPokemonDiff',
        label: 'Pokémon Differential',
        min: 0,
      },
    ],
  },
  {
    id: 'season.reporting',
    section: 'season',
    title: 'Match Pages',
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
    title: 'Prize Split',
    controls: [{ kind: 'custom', slot: 'prize-split', keys: ['prizeSplit'] }],
    validate: (v) => {
      if (!v.prizeSplit.length) return null;
      const total = v.prizeSplit.reduce((sum, share) => sum + share.percent, 0);
      return total === 100 ? null : `Prize shares total ${total}%, not 100%.`;
    },
  },

  {
    id: 'discord.invite',
    section: 'discord',
    title: 'Discord Server',
    help: 'Coaches see this as a join link on the tournament page. It works whether or not the bot is connected.',
    controls: [
      {
        kind: 'text',
        key: 'discord',
        label: 'Invite Link',
        placeholder: 'https://discord.gg/…',
      },
    ],
  },
  {
    id: 'discord.bot',
    section: 'discord',
    title: 'Discord Bot',
    help: 'Lets DraftZone post picks, assign the coach role and mirror sign-ups.',
    controls: [
      { kind: 'custom', slot: 'discord-link', keys: ['discordGuildId'] },
      {
        kind: 'text',
        key: 'discordCoachRoleId',
        label: 'Coach Role ID',
        showWhen: (v) => !!v.discordGuildId,
      },
      {
        kind: 'toggle',
        key: 'discordAutoGrantCoachRole',
        label: 'Grant the coach role on approval',
        showWhen: (v) => !!v.discordGuildId && !!v.discordCoachRoleId,
      },
      {
        kind: 'custom',
        slot: 'discord-channels',
        keys: ['discordSignUpChannelId'],
        showWhen: (v) => !!v.discordGuildId,
      },
    ],
  },
];

export const POOL_NODES: readonly PoolNode[] = [
  {
    id: 'pool.name',
    title: 'Pool Name',
    controls: [{ kind: 'text', key: 'name', label: 'Name', maxLength: 60 }],
  },
  {
    id: 'pool.channel',
    title: 'Discord Channel',
    help: 'Picks and turn notifications post here.',
    controls: [{ kind: 'custom', slot: 'pool-channel', keys: ['channelId'] }],
  },
  {
    id: 'pool.window',
    title: 'Draft Window',
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
    title: 'How Teams Pick',
    help: 'These lock once the draft starts. Without turns, every coach picks whenever they like until their roster is full.',
    controls: [
      {
        kind: 'toggle',
        key: 'sequentialTurns',
        label: 'Teams take turns',
      },
      {
        kind: 'choice',
        key: 'orderProgression',
        label: 'Progression',
        options: DRAFT_ORDERS,
        as: 'radio',
        showWhen: (pool) => pool.sequentialTurns,
      },
      {
        kind: 'toggle',
        key: 'allowDuplicates',
        label: 'Let more than one team draft the same Pokémon',
      },
    ],
  },
  {
    id: 'pool.timer',
    title: 'Pick Timer',
    help: 'A missed pick moves to the end of the round rather than stacking.',
    showWhen: (pool) => pool.sequentialTurns,
    controls: [
      { kind: 'toggle', key: 'pickTimerEnabled', label: 'Time each pick' },
      {
        kind: 'number',
        key: 'pickTimerMinutes',
        label: 'Minutes per Pick',
        min: 1,
        unit: 'min',
        showWhen: (pool) => pool.pickTimerEnabled,
      },
    ],
  },
  {
    id: 'pool.access',
    title: 'Coach Access',
    help: 'With own team only, coaches see just their own picks until the draft completes. Organizers always see every pick; switch back to everyone to reveal early.',
    controls: [
      {
        kind: 'choice',
        key: 'picksVisibleTo',
        label: 'Who sees picks',
        options: PICK_VISIBILITIES,
        as: 'radio',
      },
      {
        kind: 'toggle',
        key: 'allowRemovals',
        label: 'Allow pick removals',
        showWhen: (pool) => pool.sequentialTurns,
      },
    ],
  },
  {
    id: 'pool.teams',
    title: 'Teams',
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

export type SettingsAnchor =
  | SettingsSectionId
  | 'pools'
  | 'organizers'
  | 'completion';

export type NextStepTarget =
  | { kind: 'settings'; anchor: SettingsAnchor }
  | { kind: 'page'; path: string[] }
  | { kind: 'open-signups' };

export interface NextStep {
  id: string;
  icon: string;
  label: string;
  detail: string;
  action: string;
  target: NextStepTarget;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

const TIER_LIST_STEP: NextStep = {
  id: 'tier-list',
  icon: 'format_list_numbered',
  label: 'Attach a tier list',
  detail: 'It sets the format and what every Pokémon costs. Coaches check it before they sign up.',
  action: 'Choose Tier List',
  target: { kind: 'settings', anchor: 'draft' },
};

export function nextSteps(context: SettingsContext): NextStep[] {
  const { value, pools, signUps, unassigned, artifacts, phase } = context;
  const steps: NextStep[] = [];
  const hasTierList = artifacts.tierList.name !== null;

  if (phase === 'setup') {
    if (!hasTierList) steps.push(TIER_LIST_STEP);
    steps.push({
      id: 'open-signups',
      icon: 'how_to_reg',
      label: 'Open sign-ups',
      detail: 'Sign-ups are closed. Pick when they close and let coaches apply.',
      action: 'Open Sign-Ups',
      target: { kind: 'open-signups' },
    });
    return steps;
  }

  if (phase === 'signups') {
    if (!hasTierList) steps.push(TIER_LIST_STEP);
    const pending = signUps.filter((entry) => entry.status === 'pending').length;
    if (pending) {
      steps.push({
        id: 'review',
        icon: 'person_search',
        label: `Review ${plural(pending, 'sign-up', 'sign-ups')}`,
        detail: 'Add each coach to a pool, add them as a sub, or turn them down.',
        action: 'Review',
        target: { kind: 'page', path: ['sign-ups'] },
      });
    }
    if (!pools.length) {
      steps.push({
        id: 'pool',
        icon: 'add',
        label: 'Create a draft pool',
        detail: 'Teams draft inside a pool. It holds the turn order, timer and draft window.',
        action: 'Create Pool',
        target: { kind: 'settings', anchor: 'pools' },
      });
    } else {
      if (unassigned.length) {
        steps.push({
          id: 'unassigned',
          icon: 'group_add',
          label: `Place ${plural(unassigned.length, 'team', 'teams')} in a pool`,
          detail: 'Approved teams draft only once they are in a pool.',
          action: 'Assign Teams',
          target: { kind: 'settings', anchor: 'pools' },
        });
      }
      const unscheduled = pools.filter((pool) => !pool.draftStart.trim());
      if (unscheduled.length) {
        steps.push({
          id: 'draft-window',
          icon: 'event',
          label:
            pools.length === 1
              ? 'Schedule the draft'
              : `Schedule ${plural(unscheduled.length, 'pool', 'pools')}`,
          detail: 'Coaches see when their draft opens on the tournament page.',
          action: 'Set Draft Window',
          target: { kind: 'settings', anchor: 'pools' },
        });
      }
    }
    return steps;
  }

  if (phase === 'draft') {
    if (!artifacts.schedule.matchupCount) {
      steps.push({
        id: 'schedule',
        icon: 'calendar_month',
        label: 'Build the schedule',
        detail: 'Add stages and rounds so teams know who they play.',
        action: 'Open Schedule',
        target: { kind: 'page', path: ['schedule'] },
      });
    }
    if (!value.seasonStart.trim()) {
      steps.push({
        id: 'season-start',
        icon: 'event',
        label: 'Set when the season starts',
        detail: 'The tournament moves into its season on this date.',
        action: 'Set Season Dates',
        target: { kind: 'settings', anchor: 'season' },
      });
    }
    return steps;
  }

  const allPlayed =
    artifacts.schedule.matchupCount > 0 &&
    artifacts.schedule.playedCount >= artifacts.schedule.matchupCount;
  const finished = phase === 'complete' || (phase === 'season' && allPlayed);
  if (finished && !value.completed) {
    steps.push({
      id: 'complete',
      icon: 'emoji_events',
      label: 'Close out the season',
      detail: allPlayed
        ? 'Every match has a result. Review the final placements and add the champions to the Hall of Fame.'
        : 'The season has ended. Review the final placements and add the champions to the Hall of Fame.',
      action: 'Review Final Results',
      target: { kind: 'page', path: ['final-results'] },
    });
  }

  return steps;
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

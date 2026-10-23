import { TierListMeta } from '@pdz/features/tier-lists/tier-list.model';

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
  | 'listing'
  | 'draft'
  | 'trades'
  | 'season'
  | 'standings'
  | 'prizes'
  | 'discord';

export interface SectionLock {
  from: Lifecycle;
  reason: string;
  unlockTitle: string;
  unlockMessage: string;
  unlockedNote: string;
}

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  lock?: SectionLock;
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: 'general', label: 'General' },
  { id: 'signup', label: 'Sign-Ups' },
  { id: 'listing', label: 'Listing' },
  {
    id: 'draft',
    label: 'Draft Rules',
    lock: {
      from: 'draft',
      reason:
        'Locked because the draft has started. Coaches drafted under these rules.',
      unlockTitle: 'Unlock Draft Rules?',
      unlockMessage:
        'Changes apply to every team as soon as you save. Costs, tiers and legality are recalculated from the current tier list, so a roster that was legal can stop being legal. Review every team after saving.',
      unlockedNote:
        'Unlocked. Changes apply to every team when you save, and the section locks again after.',
    },
  },
  { id: 'trades', label: 'Trades' },
  { id: 'season', label: 'Season' },
  {
    id: 'standings',
    label: 'Standings',
    lock: {
      from: 'season',
      reason:
        'Locked because the season has started. Coaches can already see the standings.',
      unlockTitle: 'Unlock Standings?',
      unlockMessage:
        'Changing points, tiebreakers or forfeit scores re-ranks every team from the results already recorded. Coaches see the new order as soon as you save.',
      unlockedNote:
        'Unlocked. The standings are re-ranked when you save, and the section locks again after.',
    },
  },
  { id: 'prizes', label: 'Prizes' },
  { id: 'discord', label: 'Discord' },
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
  logVisibility: 'participants' | 'public';

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

export const POOL_DEFAULTS: Partial<DraftPoolValue> = {
  channelId: '',
  orderProgression: 'snake',
  picksVisibleTo: 'everyone',
  allowRemovals: false,
};

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

export type ControlSpecFor<V> = {
  showWhen?: (value: V) => boolean;
  fixed?: boolean;
} & (
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
  hint?: string;
  help: string;
  advanced?: boolean;
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
  meta?: TierListMeta | null;
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
    help: "The name appears on the tournament page, in your league, on every coach's My Leagues and in Discord posts. The description sits under it on the tournament page, and on Find a League if you list the tournament there.",
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
    help: 'Shown beside the tournament name across the site. Square images look best. Without one, the DraftZone logo stands in.',
    controls: [
      { kind: 'custom', slot: 'logo', label: 'Tournament Logo', keys: ['logo'] },
    ],
  },
  {
    id: 'signup.deadline',
    section: 'signup',
    title: 'Sign-Up Deadline',
    help: 'The sign-up form closes on its own at this time, even if access below is still open. You can keep reviewing anyone who applied before then.',
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
    help: 'Anyone can apply puts a Sign Up button on the tournament page. Invite link only hides that button, so people need the link you share to apply; the tournament itself stays visible. Closed stops new applications. Every applicant still waits for you to approve them on Sign-Ups.',
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
    advanced: true,
    hint: 'Extra questions on the sign-up form.',
    help: 'Every form already asks for a name, Showdown name, Discord, timezone and team name. Add your own here, such as experience or availability. The answers show on each applicant in Sign-Ups.',
    controls: [{ kind: 'custom', slot: 'signup-questions', keys: ['signUpQuestions'] }],
  },
  {
    id: 'signup.capacity',
    section: 'signup',
    title: 'Team Limit',
    advanced: true,
    help: 'The most teams the tournament takes. Sign-ups stay open past the limit, so extra applicants form a waitlist you can pull from if a coach drops.',
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
    id: 'listing.ad',
    section: 'listing',
    title: 'Find a League Listing',
    hint: 'Shown on Find a League until sign-ups close.',
    help: 'Find a League is the public list of tournaments looking for coaches. List yours to appear there until sign-ups close. Skill level, prize value and platforms help coaches find a tournament that suits them.',
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
    help: "Every coach must draft at least the minimum number of Pokémon and can't go past the maximum. With a point budget, each Pokémon costs the points its tier is worth on the tier list, and a team can't spend more than its budget.",
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
    hint: 'Sets the format, the costs and which Pokémon are legal.',
    help: 'The tier list decides the format, which Pokémon can be drafted and what each one costs. Attaching one copies it into this tournament, so later edits by its author never reprice your draft. Required and Limit set how many picks each team must, or may, take from a tier.',
    controls: [
      { kind: 'custom', slot: 'tier-requirements', keys: ['tierRequirements'] },
    ],
  },
  {
    id: 'trades.points',
    section: 'trades',
    title: 'Trade Points',
    requiresTierList: true,
    help: "Every trade spends trade points for the teams in it. With a limit, a team can't spend more than this across the whole season, so nobody rebuilds their roster through trades.",
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
    help: 'On the start date the tournament moves from its draft into its season, and the standings go live. After the end date it counts as finished, ready for you to review the final results.',
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
    id: 'standings.scoring',
    section: 'standings',
    title: 'Scoring',
    hint: 'Ranked by points, then each tiebreaker in order.',
    help: 'Teams are ranked by points: what a win, draw or loss is worth. Teams on the same points are split by the tiebreakers, top to bottom. The differential is the number shown beside each team every round: Pokémon differential counts the Pokémon a winner had left, game differential counts games won minus games lost.',
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
    id: 'standings.forfeits',
    section: 'standings',
    title: 'Forfeits',
    advanced: true,
    hint: "The score recorded when a match isn't played.",
    help: 'When a match is forfeited, the team that showed up is credited with a win by this margin: this many games for game differential, and this many Pokémon left for Pokémon differential.',
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
    help: "With coach reporting on, coaches enter their own match results, and each report waits for an organizer to approve it before it counts. Matchup chat gives the two coaches in a match a place on its page to talk and set a time.",
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
    id: 'season.log',
    section: 'season',
    title: 'Tournament Log',
    help: "The log records every tier list swap and edit once sign-ups open, every unlock of a locked section, and every change to draft and standings rules, with who made it and any note they left. Coaches and organizers can always read it; make it public to let anyone check the tournament was run fairly. Entries can't be edited or deleted.",
    controls: [
      {
        kind: 'choice',
        key: 'logVisibility',
        label: 'Who Can Read the Log',
        as: 'radio',
        options: [
          { value: 'participants', label: 'Coaches and organizers' },
          { value: 'public', label: 'Anyone' },
        ],
      },
    ],
  },
  {
    id: 'prizes.split',
    section: 'prizes',
    title: 'Prize Split',
    help: 'How the prize pool is shared between the top finishers, as a percentage for each place. The shares must add up to 100%. Leave it empty if there are no prizes.',
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
    hint: 'A join link on the tournament page.',
    help: 'Puts a Join Discord button on the tournament page so coaches can find your server. It works whether or not the bot is connected.',
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
    hint: 'Posts picks, assigns the coach role and mirrors sign-ups.',
    help: 'Add the DraftZone bot to your server and it posts each pick, pings the coach whose turn it is, can give approved coaches a role, and posts new sign-ups to a channel you choose. The role ID comes from Discord: right-click the role with Developer Mode on and copy its ID.',
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
    help: "Shown on this pool's draft board and in the tournament nav. Coaches only see it when the tournament has more than one pool.",
    controls: [{ kind: 'text', key: 'name', label: 'Name', maxLength: 60 }],
  },
  {
    id: 'pool.channel',
    title: 'Discord Channel',
    advanced: true,
    hint: 'Where picks and turn alerts post.',
    help: "The Discord channel where this pool's picks post and the coach on the clock is pinged. The bot has to be connected under Discord first.",
    controls: [{ kind: 'custom', slot: 'pool-channel', keys: ['channelId'] }],
  },
  {
    id: 'pool.window',
    title: 'Draft Window',
    help: "When this pool's draft opens and when it should be finished. Coaches see the opening time on the tournament page. The tournament's draft window runs from the earliest pool opening to the latest close.",
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
    advanced: true,
    hint: 'Locks once the draft starts.',
    help: 'With turns, coaches pick one at a time. Snake order reverses every round (1 to 10, then 10 to 1), so the team picking last in one round picks first in the next; linear runs 1 to 10 every round. Without turns, every coach picks whenever they like until their roster is full. Letting more than one team draft the same Pokémon suits large or casual events.',
    controls: [
      {
        kind: 'toggle',
        key: 'sequentialTurns',
        label: 'Teams take turns',
        fixed: true,
      },
      {
        kind: 'choice',
        key: 'orderProgression',
        label: 'Progression',
        options: DRAFT_ORDERS,
        as: 'radio',
        fixed: true,
        showWhen: (pool) => pool.sequentialTurns,
      },
      {
        kind: 'toggle',
        key: 'allowDuplicates',
        label: 'Let more than one team draft the same Pokémon',
        fixed: true,
      },
    ],
  },
  {
    id: 'pool.timer',
    title: 'Pick Timer',
    advanced: true,
    help: 'Each coach gets this long to make a pick. A missed pick moves to the end of the round instead of holding everyone up. You can switch the timer off and on during the draft, but its length is set before the draft starts.',
    showWhen: (pool) => pool.sequentialTurns,
    controls: [
      { kind: 'toggle', key: 'pickTimerEnabled', label: 'Time each pick' },
      {
        kind: 'number',
        key: 'pickTimerMinutes',
        label: 'Minutes per Pick',
        min: 1,
        unit: 'min',
        fixed: true,
        showWhen: (pool) => pool.pickTimerEnabled,
      },
    ],
  },
  {
    id: 'pool.access',
    title: 'Coach Access',
    advanced: true,
    help: 'With own team only, coaches see just their own picks until the draft ends; organizers always see every pick, and switching to everyone reveals them early. Pick removals let a coach take back a pick during a turn-based draft.',
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
    help: "The teams drafting in this pool, in the order they pick. Drag to reorder, or randomize the order so it's shuffled when the draft opens. The order can't change once the draft has started.",
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

export function sectionLock(
  section: SettingsSection,
  phase: Lifecycle,
): SectionLock | null {
  if (!section.lock) return null;
  return lifecycleReached(phase, section.lock.from) ? section.lock : null;
}
export type SettingsAnchor =
  | 'setup'
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

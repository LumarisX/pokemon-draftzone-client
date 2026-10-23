import { DraftPoolValue, SettingsValue, draftNotStarted } from './settings-schema';

export type QuickSetupId = 'draftStyle' | 'draftPace' | 'scoring';

export type QuickSetupOption = {
  value: string;
  label: string;
  icon: string;
  summary: string;
};

export type QuickSetupContext = {
  settings: SettingsValue;
  pools: readonly DraftPoolValue[];
  format: string;
  standingsLocked: boolean;
};

export type QuickSetupPatch = {
  settings?: Partial<SettingsValue>;
  pools?: Partial<DraftPoolValue>;
};

export type QuickSetupQuestion = {
  id: QuickSetupId;
  title: string;
  prompt: string;
  help: string;
  anchor: string;
  options: readonly QuickSetupOption[];
  current: (context: QuickSetupContext) => string | null;
  apply: (value: string) => QuickSetupPatch;
  unavailable?: (context: QuickSetupContext) => string | null;
  recommended?: (context: QuickSetupContext) => string | null;
};

export const LIVE_PICK_MINUTES = 3;
export const SLOW_PICK_MINUTES = 12 * 60;
const LIVE_LIMIT_MINUTES = 60;

const DOUBLES_FORMATS = new Set(['VGC', 'Doubles', 'LC VGC']);

export function isDoublesFormat(format: string): boolean {
  return DOUBLES_FORMATS.has(format);
}

function shared<T>(
  pools: readonly DraftPoolValue[],
  read: (pool: DraftPoolValue) => T | null,
): T | null {
  if (!pools.length) return null;
  const first = read(pools[0]);
  return pools.every((pool) => read(pool) === first) ? first : null;
}

function poolsUnavailable(context: QuickSetupContext): string | null {
  if (!context.pools.length) return 'Create a draft pool first.';
  if (context.pools.some((pool) => !draftNotStarted(pool.status)))
    return "Locked because a draft has started. This can't change mid-draft.";
  return null;
}

export const QUICK_SETUP: readonly QuickSetupQuestion[] = [
  {
    id: 'draftStyle',
    title: 'Draft Style',
    prompt: 'How do coaches pick their Pokémon?',
    help: "Traditional is the classic league draft: coaches take turns, and grabbing a Pokémon first keeps it away from everyone else. Open suits casual or large events where coaches shouldn't have to wait on each other. Turn order and duplicates can be fine-tuned under Draft Pools.",
    anchor: 'pools',
    options: [
      {
        value: 'traditional',
        label: 'Traditional',
        icon: 'swap_vert',
        summary:
          'Coaches take turns in snake order (1 to 10, then 10 to 1). Once a Pokémon is picked, nobody else can have it.',
      },
      {
        value: 'open',
        label: 'Open',
        icon: 'groups',
        summary:
          'No turns. Every coach builds their roster whenever they like, and two teams can own the same Pokémon.',
      },
    ],
    current: ({ pools }) =>
      shared(pools, (pool) => {
        if (pool.sequentialTurns && !pool.allowDuplicates) return 'traditional';
        if (!pool.sequentialTurns && pool.allowDuplicates) return 'open';
        return null;
      }),
    apply: (value) => ({
      pools:
        value === 'open'
          ? { sequentialTurns: false, allowDuplicates: true }
          : {
              sequentialTurns: true,
              orderProgression: 'snake',
              allowDuplicates: false,
            },
    }),
    unavailable: poolsUnavailable,
  },
  {
    id: 'draftPace',
    title: 'Draft Pace',
    prompt: 'How long does each coach get to make a pick?',
    help: 'When a coach runs out of time, their pick moves to the end of the round instead of holding everyone up. Only drafts where coaches take turns have a timer. The exact minutes per pick can be set under Draft Pools.',
    anchor: 'pools',
    options: [
      {
        value: 'live',
        label: 'Live',
        icon: 'bolt',
        summary: `Everyone drafts together in one sitting, with ${LIVE_PICK_MINUTES} minutes per pick.`,
      },
      {
        value: 'slow',
        label: 'Slow',
        icon: 'hourglass_top',
        summary: `The draft runs over several days, with ${SLOW_PICK_MINUTES / 60} hours per pick, so nobody has to be online at the same time.`,
      },
      {
        value: 'untimed',
        label: 'Untimed',
        icon: 'all_inclusive',
        summary:
          'No clock. The draft moves on whenever the coach whose turn it is makes their pick.',
      },
    ],
    current: ({ pools }) =>
      shared(pools, (pool) => {
        if (!pool.pickTimerEnabled) return 'untimed';
        return pool.pickTimerMinutes <= LIVE_LIMIT_MINUTES ? 'live' : 'slow';
      }),
    apply: (value) => ({
      pools:
        value === 'untimed'
          ? { pickTimerEnabled: false }
          : {
              pickTimerEnabled: true,
              pickTimerMinutes:
                value === 'live' ? LIVE_PICK_MINUTES : SLOW_PICK_MINUTES,
            },
    }),
    unavailable: (context) =>
      poolsUnavailable(context) ??
      (context.pools.every((pool) => !pool.sequentialTurns)
        ? 'Open drafts have no turns, so there is no pick timer.'
        : null),
  },
  {
    id: 'scoring',
    title: 'Battle Style',
    prompt: 'Are matches played as singles or doubles?',
    help: 'This decides how close standings are settled. Singles games usually end with several Pokémon left, so the number remaining is a fair measure of how close a game was. Doubles games swing faster, so most doubles leagues count games won instead. The full scoring and tiebreakers are under Standings.',
    anchor: 'standings',
    options: [
      {
        value: 'pokemon',
        label: 'Singles',
        icon: 'person',
        summary:
          'Teams on the same points are split by Pokémon differential: how many Pokémon the winner had left.',
      },
      {
        value: 'game',
        label: 'Doubles',
        icon: 'group',
        summary:
          'Teams on the same points are split by game differential: games won minus games lost.',
      },
    ],
    current: ({ settings }) => settings.diffMode,
    apply: (value) => ({
      settings: { diffMode: value === 'game' ? 'game' : 'pokemon' },
    }),
    unavailable: ({ standingsLocked }) =>
      standingsLocked
        ? 'Locked because the season has started. Unlock it under Standings.'
        : null,
    recommended: ({ format }) =>
      format ? (isDoublesFormat(format) ? 'game' : 'pokemon') : null,
  },
];

import { DraftPoolValue, SettingsValue, draftNotStarted } from './settings-schema';

export type QuickSetupId = 'draftStyle' | 'draftPace' | 'scoring';

export type QuickSetupOption = {
  value: string;
  label: string;
  summary: string;
};

export type QuickSetupContext = {
  settings: SettingsValue;
  pools: readonly DraftPoolValue[];
  format: string;
};

export type QuickSetupPatch = {
  settings?: Partial<SettingsValue>;
  pools?: Partial<DraftPoolValue>;
};

export type QuickSetupQuestion = {
  id: QuickSetupId;
  title: string;
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
    return 'Locked: a draft has already started.';
  return null;
}

export const QUICK_SETUP: readonly QuickSetupQuestion[] = [
  {
    id: 'draftStyle',
    title: 'Draft Style',
    anchor: 'pools',
    options: [
      {
        value: 'traditional',
        label: 'Traditional',
        summary: 'Teams take turns in snake order; each Pokémon is drafted once.',
      },
      {
        value: 'open',
        label: 'Open',
        summary: 'No turns, and any team can draft any Pokémon.',
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
    anchor: 'pools',
    options: [
      {
        value: 'live',
        label: 'Live',
        summary: `Everyone online together, ${LIVE_PICK_MINUTES} minutes per pick.`,
      },
      {
        value: 'slow',
        label: 'Slow',
        summary: `Picks spread over days, ${SLOW_PICK_MINUTES / 60} hours per pick.`,
      },
      {
        value: 'untimed',
        label: 'Untimed',
        summary: 'No pick timer; the draft moves when coaches pick.',
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
    title: 'Scoring',
    anchor: 'season',
    options: [
      {
        value: 'pokemon',
        label: 'Singles',
        summary: 'Pokémon differential decides close standings.',
      },
      {
        value: 'game',
        label: 'Doubles',
        summary: 'Game differential decides close standings.',
      },
    ],
    current: ({ settings }) => settings.diffMode,
    apply: (value) => ({
      settings: { diffMode: value === 'game' ? 'game' : 'pokemon' },
    }),
    recommended: ({ format }) =>
      format ? (isDoublesFormat(format) ? 'game' : 'pokemon') : null,
  },
];

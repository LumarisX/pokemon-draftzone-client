export type StorageScope = 'account' | 'device' | 'planner';

export interface StorageEntry {
  readonly key: string;
  readonly match: 'exact' | 'prefix';
  readonly scope: StorageScope;
  readonly holds: string;
}

export const SETTINGS_STORAGE_KEY = 'user-settings';
export const PLANNER_STORAGE_KEY = 'plannerData';
export const SYNC_MARKER_SUFFIX = ':sync';

export function syncMarkerKey(plannerKey: string): string {
  return `${plannerKey}${SYNC_MARKER_SUFFIX}`;
}

export const STORAGE_REGISTRY: readonly StorageEntry[] = [
  {
    key: SETTINGS_STORAGE_KEY,
    match: 'exact',
    scope: 'account',
    holds: 'Theme, mode, time, date and sprite settings that sync with the account',
  },
  {
    key: PLANNER_STORAGE_KEY,
    match: 'prefix',
    scope: 'planner',
    holds:
      'Planner plans (free and per tournament) and their ":sync" markers; plans with a marker are a copy of the account',
  },
  {
    key: 'pdzSwCleanupDone',
    match: 'exact',
    scope: 'device',
    holds: 'One-time service worker cleanup flag',
  },
  {
    key: 'pdz-wheel-items',
    match: 'exact',
    scope: 'device',
    holds: 'Wheel tool items',
  },
  {
    key: 'pdz-wheel-options',
    match: 'exact',
    scope: 'device',
    holds: 'Wheel tool options',
  },
  {
    key: 'pdz-wheel-history',
    match: 'exact',
    scope: 'device',
    holds: 'Wheel tool spin history',
  },
  {
    key: 'pdz-saved-searches',
    match: 'exact',
    scope: 'device',
    holds: 'Saved Pokémon searches',
  },
  {
    key: 'pdz.replayAnalyzer.showAdvancedDetails',
    match: 'exact',
    scope: 'device',
    holds: 'Replay analyzer advanced details toggle',
  },
  {
    key: 'pdz.replayAnalyzer.version',
    match: 'exact',
    scope: 'device',
    holds: 'Replay analyzer version choice',
  },
  {
    key: 'pdz.replayAnalyzer.history',
    match: 'exact',
    scope: 'device',
    holds: 'Replay analyzer history',
  },
  {
    key: 'binderData',
    match: 'exact',
    scope: 'device',
    holds: 'Card binder tool data',
  },
  {
    key: 'shinyunlocked',
    match: 'exact',
    scope: 'device',
    holds: 'Legacy shiny unlock flag, read only',
  },
  {
    key: 'matchup_moves_view',
    match: 'exact',
    scope: 'device',
    holds: 'Move chart view choice',
  },
  {
    key: 'newsTime',
    match: 'exact',
    scope: 'device',
    holds: 'When news was last read',
  },
  {
    key: 'leagueTime',
    match: 'exact',
    scope: 'device',
    holds: 'When league news was last read',
  },
  {
    key: 'pdz_teambuilder_pending',
    match: 'exact',
    scope: 'device',
    holds: 'Teambuilder saves that did not reach the server, keyed by team slug',
  },
  {
    key: 'matchup_teambuilder',
    match: 'exact',
    scope: 'device',
    holds: 'Legacy teambuilder teams awaiting import',
  },
  {
    key: 'league-power-rankings',
    match: 'exact',
    scope: 'device',
    holds: 'Power rankings scratch scores',
  },
];

export function storageEntryFor(key: string): StorageEntry | null {
  return (
    STORAGE_REGISTRY.find((entry) =>
      entry.match === 'exact' ? entry.key === key : key.startsWith(entry.key),
    ) ?? null
  );
}

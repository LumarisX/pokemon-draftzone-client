import {
  BracketRoundMeta,
  BracketSlotFlex,
  FlexBracketMatch,
} from './bracket.model';

export type EntrantKind = 'team' | 'place' | 'open';

export interface ScheduleEntrant {
  kind: EntrantKind;
  teamId?: string | null;
  sourceStageKey?: string;
  place?: number;
}

export type ScheduleStageType =
  | 'round-robin'
  | 'single-elimination'
  | 'double-elimination'
  | 'triple-elimination'
  | 'swiss'
  | 'custom';

export interface ScheduleStage {
  key: string;
  stageId?: string;
  name: string;
  type: ScheduleStageType;
  public: boolean;
  entrants: ScheduleEntrant[];
  random: boolean;
  drawn: boolean;
  storesEntrants: boolean;
  entrantsChanged: boolean;
  startRound?: number;
}

export interface ScheduleRound extends BracketRoundMeta {
  key: string;
  auto?: boolean;
}

export interface ScheduleDraft {
  rounds: ScheduleRound[];
  stages: ScheduleStage[];
  matches: FlexBracketMatch[];
}

export interface ScheduleTeam {
  teamId: string;
  teamName: string;
  coachName: string;
  logo?: string;
  teamSlug?: string;
  poolName?: string | null;
}

export interface ProjectedStanding {
  teamId: string;
  teamName: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  gameDiff: number;
}

export interface StageProjection {
  stageId: string;
  complete: boolean;
  standings: ProjectedStanding[];
}

export type BracketGroup = 'upper' | 'lower' | 'last' | 'final';

export const BRACKET_GROUP_TITLES: Record<BracketGroup, string> = {
  upper: 'Upper Bracket',
  lower: 'Lower Bracket',
  last: 'Last Chance Bracket',
  final: 'Finals',
};

export const STAGE_FORMATS: Record<
  ScheduleStageType,
  { label: string; icon: string; lives: number }
> = {
  'round-robin': { label: 'Round Robin', icon: 'grid_view', lives: 0 },
  'single-elimination': {
    label: 'Single Elimination',
    icon: 'account_tree',
    lives: 1,
  },
  'double-elimination': {
    label: 'Double Elimination',
    icon: 'account_tree',
    lives: 2,
  },
  'triple-elimination': {
    label: 'Triple Elimination',
    icon: 'account_tree',
    lives: 3,
  },
  swiss: { label: 'Swiss', icon: 'swap_horiz', lives: 0 },
  custom: { label: 'Custom', icon: 'dashboard_customize', lives: 0 },
};

export const ELIMINATION_TYPES: ScheduleStageType[] = [
  'single-elimination',
  'double-elimination',
  'triple-elimination',
];

export const isElimination = (type: ScheduleStageType): boolean =>
  ELIMINATION_TYPES.includes(type);

export const stageKeyOf = (match: FlexBracketMatch): string =>
  match.section ?? 'main';

let localKeyCounter = 0;
export function nextLocalKey(prefix: string): string {
  localKeyCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${localKeyCounter}`;
}

export function ordinal(n: number): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

export function stageMatches(
  draft: ScheduleDraft,
  stageKey: string,
): FlexBracketMatch[] {
  return draft.matches
    .filter((match) => stageKeyOf(match) === stageKey)
    .sort((a, b) => a.round - b.round || a.position - b.position);
}

export interface StageSpan {
  first: number;
  last: number;
}

export function stageSpan(draft: ScheduleDraft, stage: ScheduleStage): StageSpan {
  const rounds = draft.matches
    .filter((match) => stageKeyOf(match) === stage.key)
    .map((match) => match.round);
  if (rounds.length === 0) {
    const at = stage.startRound ?? 0;
    return { first: at, last: at };
  }
  return { first: Math.min(...rounds), last: Math.max(...rounds) };
}

export function stageLanes(draft: ScheduleDraft): {
  lanes: Map<string, number>;
  count: number;
} {
  const spans = draft.stages
    .map((stage) => ({ key: stage.key, ...stageSpan(draft, stage) }))
    .sort((a, b) => a.first - b.first);
  const ends: number[] = [];
  const lanes = new Map<string, number>();
  for (const span of spans) {
    let lane = ends.findIndex((end) => span.first > end);
    if (lane === -1) {
      lane = ends.length;
      ends.push(span.last);
    } else {
      ends[lane] = span.last;
    }
    lanes.set(span.key, lane);
  }
  return { lanes, count: Math.max(1, ends.length) };
}

export function matchLabels(draft: ScheduleDraft): Map<string, string> {
  const labels = new Map<string, string>();
  for (const stage of draft.stages) {
    let n = 1;
    for (const match of stageMatches(draft, stage.key)) {
      labels.set(match.id, match.label ?? `Match ${n++}`);
    }
  }
  return labels;
}

export function bracketGroups(
  matches: FlexBracketMatch[],
): Map<string, BracketGroup> {
  const byId = new Map(matches.map((match) => [match.id, match]));
  const level = new Map<string, number>();
  const finals = new Set<string>();

  const levelOf = (match: FlexBracketMatch, depth = 0): number => {
    const known = level.get(match.id);
    if (known !== undefined) return known;
    if (depth > 64) return 0;
    const sideLevel = (slot: BracketSlotFlex): number | null => {
      if (slot.type !== 'winner' && slot.type !== 'loser') return 0;
      const source = byId.get(slot.from);
      if (!source) return null;
      return levelOf(source, depth + 1) + (slot.type === 'loser' ? 1 : 0);
    };
    const a = sideLevel(match.a);
    const b = sideLevel(match.b);
    const sides = [a, b].filter((x): x is number => x !== null);
    const value = sides.length ? Math.max(...sides) : 0;
    if (a !== null && b !== null && a !== b) finals.add(match.id);
    level.set(match.id, value);
    return value;
  };

  const groups = new Map<string, BracketGroup>();
  for (const match of matches) {
    const value = levelOf(match);
    groups.set(
      match.id,
      finals.has(match.id)
        ? 'final'
        : value === 0
          ? 'upper'
          : value === 1
            ? 'lower'
            : 'last',
    );
  }
  return groups;
}

export function padRounds(draft: ScheduleDraft): ScheduleDraft {
  const needed = Math.max(
    draft.matches.reduce((max, match) => Math.max(max, match.round + 1), 0),
    ...draft.stages.map((stage) => (stage.startRound ?? 0) + 1),
  );
  if (needed <= draft.rounds.length) return draft;
  const rounds = [...draft.rounds];
  while (rounds.length < needed) {
    rounds.push({
      key: nextLocalKey('round'),
      name: `Week ${rounds.length + 1}`,
      auto: true,
    });
  }
  return { ...draft, rounds };
}

export function trimAutoRounds(draft: ScheduleDraft): ScheduleDraft {
  const lastUsed = Math.max(
    draft.matches.reduce((max, match) => Math.max(max, match.round), -1),
    ...draft.stages.map((stage) => stage.startRound ?? -1),
  );
  let end = draft.rounds.length;
  while (end - 1 > lastUsed && draft.rounds[end - 1]?.auto) end -= 1;
  if (end === draft.rounds.length) return draft;
  return { ...draft, rounds: draft.rounds.slice(0, Math.max(1, end)) };
}

export function claimRound(round: ScheduleRound): ScheduleRound {
  if (!round.auto) return round;
  const { auto: _auto, ...claimed } = round;
  return claimed;
}

function remapRounds(
  draft: ScheduleDraft,
  remap: (round: number) => number,
): Pick<ScheduleDraft, 'matches' | 'stages'> {
  return {
    matches: draft.matches.map((match) => ({
      ...match,
      round: remap(match.round),
    })),
    stages: draft.stages.map((stage) =>
      stage.startRound === undefined
        ? stage
        : { ...stage, startRound: remap(stage.startRound) },
    ),
  };
}

export function insertRound(draft: ScheduleDraft, index: number): ScheduleDraft {
  const at = Math.max(0, Math.min(index, draft.rounds.length));
  const rounds = [...draft.rounds];
  rounds.splice(at, 0, {
    key: nextLocalKey('round'),
    name: `Week ${draft.rounds.length + 1}`,
  });
  return {
    rounds,
    ...remapRounds(draft, (round) => (round >= at ? round + 1 : round)),
  };
}

export function roundIsEmpty(draft: ScheduleDraft, index: number): boolean {
  return !draft.matches.some((match) => match.round === index);
}

export function removeRound(draft: ScheduleDraft, index: number): ScheduleDraft {
  if (draft.rounds.length <= 1 || !roundIsEmpty(draft, index)) return draft;
  return {
    rounds: draft.rounds.filter((_, i) => i !== index),
    ...remapRounds(draft, (round) => (round > index ? round - 1 : round)),
  };
}

export function shiftStage(
  draft: ScheduleDraft,
  stageKey: string,
  toRound: number,
): ScheduleDraft {
  const stage = draft.stages.find((s) => s.key === stageKey);
  if (!stage) return draft;
  const delta = toRound - stageSpan(draft, stage).first;
  if (delta === 0) return draft;
  return padRounds({
    ...draft,
    matches: draft.matches.map((match) =>
      stageKeyOf(match) === stageKey
        ? { ...match, round: match.round + delta }
        : match,
    ),
    stages: draft.stages.map((s) =>
      s.key === stageKey ? { ...s, startRound: toRound } : s,
    ),
  });
}

export function defaultStartRound(draft: ScheduleDraft): number {
  if (draft.stages.length === 0) return 0;
  return (
    Math.max(...draft.stages.map((stage) => stageSpan(draft, stage).last)) + 1
  );
}

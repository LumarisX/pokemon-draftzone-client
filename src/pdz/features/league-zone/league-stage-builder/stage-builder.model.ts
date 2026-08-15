import {
  BracketRoundMeta,
  FlexBracketMatch,
} from '../league-bracket/bracket.model';

export interface BuilderRound extends BracketRoundMeta {
  key: string;
  auto?: boolean;
}

export type BuilderStageType =
  | 'round-robin'
  | 'single-elimination'
  | 'double-elimination'
  | 'swiss'
  | 'custom';

export interface BuilderStage {
  stageId?: string;
  key: string;
  name: string;
  type: BuilderStageType;
  teamIds: string[];
  random: boolean;
  public?: boolean;
  order?: number;
  roundTitles?: Record<number, string>;
  seeded?: boolean;
}

export interface BuilderDraft {
  rounds: BuilderRound[];
  stages: BuilderStage[];
  matches: FlexBracketMatch[];
}

export interface StageSpan {
  key: string;
  firstRound: number;
  lastRound: number;
}

let localKeyCounter = 0;
export function nextRoundKey(): string {
  localKeyCounter += 1;
  return `round-${Date.now().toString(36)}-${localKeyCounter}`;
}

export const stageKeyOf = (match: FlexBracketMatch): string =>
  match.section ?? 'main';

export function cellMatches(
  matches: FlexBracketMatch[],
  stageKey: string,
  round: number,
): FlexBracketMatch[] {
  return matches
    .filter((m) => stageKeyOf(m) === stageKey && m.round === round)
    .sort((a, b) => a.position - b.position);
}

export function stageSpans(
  draft: BuilderDraft,
  emptyAt?: Map<string, number>,
): StageSpan[] {
  const keys = [
    ...new Set([
      ...draft.stages.map((s) => s.key),
      ...draft.matches.map(stageKeyOf),
    ]),
  ];
  const orderOf = (key: string) =>
    draft.stages.find((s) => s.key === key)?.order ?? Number.MAX_SAFE_INTEGER;

  return keys
    .sort((a, b) => orderOf(a) - orderOf(b))
    .map((key) => {
      const rounds = draft.matches
        .filter((m) => stageKeyOf(m) === key)
        .map((m) => m.round);
      if (rounds.length === 0) {
        const round = emptyAt?.get(key) ?? 0;
        return { key, firstRound: round, lastRound: round };
      }
      return {
        key,
        firstRound: Math.min(...rounds),
        lastRound: Math.max(...rounds),
      };
    });
}

export function moveStage(
  draft: BuilderDraft,
  stageKey: string,
  delta: number,
): BuilderDraft {
  const rounds = draft.matches
    .filter((m) => stageKeyOf(m) === stageKey)
    .map((m) => m.round);
  if (rounds.length === 0) return draft;
  if (Math.min(...rounds) + delta < 0) return draft;

  const moved = {
    ...draft,
    matches: draft.matches.map((m) =>
      stageKeyOf(m) === stageKey ? { ...m, round: m.round + delta } : m,
    ),
    stages: draft.stages.map((stage) =>
      stage.key === stageKey && stage.roundTitles
        ? {
            ...stage,
            roundTitles: Object.fromEntries(
              Object.entries(stage.roundTitles).map(([rn, title]) => [
                Number(rn) + delta,
                title,
              ]),
            ),
          }
        : stage,
    ),
  };
  return padRounds(moved);
}

export function roundIsEmpty(draft: BuilderDraft, round: number): boolean {
  return !draft.matches.some((m) => m.round === round);
}

export function insertRound(
  draft: BuilderDraft,
  index: number,
  round: Omit<BuilderRound, 'key'>,
): BuilderDraft {
  const at = Math.max(0, Math.min(index, draft.rounds.length));
  const rounds = [...draft.rounds];
  rounds.splice(at, 0, { ...round, key: nextRoundKey() });

  return {
    ...draft,
    rounds,
    matches: draft.matches.map((m) =>
      m.round >= at ? { ...m, round: m.round + 1 } : m,
    ),
    stages: shiftRoundTitles(draft.stages, (rn) => (rn >= at ? rn + 1 : rn)),
  };
}

export function removeRound(draft: BuilderDraft, index: number): BuilderDraft {
  if (index < 0 || index >= draft.rounds.length) return draft;
  if (!roundIsEmpty(draft, index)) return draft;

  return {
    ...draft,
    rounds: draft.rounds.filter((_, i) => i !== index),
    matches: draft.matches.map((m) =>
      m.round > index ? { ...m, round: m.round - 1 } : m,
    ),
    stages: shiftRoundTitles(draft.stages, (rn) => (rn > index ? rn - 1 : rn)),
  };
}

export function reorderRounds(
  draft: BuilderDraft,
  from: number,
  to: number,
): BuilderDraft {
  if (from === to) return draft;
  if (from < 0 || from >= draft.rounds.length) return draft;
  const target = Math.max(0, Math.min(to, draft.rounds.length - 1));

  const rounds = [...draft.rounds];
  const [moved] = rounds.splice(from, 1);
  rounds.splice(target, 0, moved);

  const remap = new Map<number, number>();
  rounds.forEach((round, newIndex) => {
    remap.set(
      draft.rounds.findIndex((r) => r.key === round.key),
      newIndex,
    );
  });

  return {
    ...draft,
    rounds,
    matches: draft.matches.map((m) => ({
      ...m,
      round: remap.get(m.round) ?? m.round,
    })),
    stages: shiftRoundTitles(draft.stages, (rn) => remap.get(rn) ?? rn),
  };
}

function shiftRoundTitles(
  stages: BuilderStage[],
  remap: (round: number) => number,
): BuilderStage[] {
  return stages.map((stage) => {
    if (!stage.roundTitles) return stage;
    return {
      ...stage,
      roundTitles: Object.fromEntries(
        Object.entries(stage.roundTitles).map(([rn, title]) => [
          remap(Number(rn)),
          title,
        ]),
      ),
    };
  });
}

export function padRounds(draft: BuilderDraft): BuilderDraft {
  const needed = draft.matches.reduce((max, m) => Math.max(max, m.round + 1), 0);
  if (needed <= draft.rounds.length) return draft;

  const rounds = [...draft.rounds];
  while (rounds.length < needed) {
    rounds.push({
      key: nextRoundKey(),
      name: `Round ${rounds.length + 1}`,
      auto: true,
    });
  }
  return { ...draft, rounds };
}

export function trimAutoRounds(draft: BuilderDraft): BuilderDraft {
  const lastUsed = draft.matches.reduce((max, m) => Math.max(max, m.round), -1);

  let end = draft.rounds.length;
  while (end - 1 > lastUsed && draft.rounds[end - 1]?.auto) end -= 1;
  if (end === draft.rounds.length) return draft;

  return { ...draft, rounds: draft.rounds.slice(0, Math.max(1, end)) };
}

export function claimRound(round: BuilderRound): BuilderRound {
  if (!round.auto) return round;
  const { auto: _auto, ...claimed } = round;
  return claimed;
}

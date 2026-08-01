// ─── Tournament builder draft model ──────────────────────────────────────────
//
// The builder edits one `BuilderDraft`: the tournament's round axis, the stages
// laid across it, and the matches sitting in the (stage, round) cells they
// form. Every operation here is pure and returns a new draft, so the component
// can hold it in a signal and diff it against what was loaded.
//
// These were "sections" of one stage until sections were promoted to stages.
// The grid never cared about the distinction — it only ever placed a match in a
// (group, round) cell — so the geometry is unchanged and only the names and the
// ownership of seeds moved.

import {
  BracketRoundMeta,
  FlexBracketMatch,
} from '../league-bracket/bracket.model';

export interface BuilderRound extends BracketRoundMeta {
  /**
   * Stable local identity. A saved round uses its server `id`; a round added
   * in this session has none yet, and reordering must not make the grid think
   * rows were destroyed and rebuilt.
   */
  key: string;
  /**
   * Added by `padRounds` to make room for a match, not by the organizer. Only
   * these are reclaimed when the matches move back off them — a round someone
   * deliberately created stays until they delete it themselves.
   */
  auto?: boolean;
}

export type BuilderStageType =
  | 'round-robin'
  | 'single-elimination'
  | 'double-elimination'
  | 'swiss'
  | 'custom';

export interface BuilderStage {
  /** Server stage id. Absent for a stage added in this session. */
  stageId?: string;
  /** Local handle; `FlexBracketMatch.section` holds this. */
  key: string;
  name: string;
  type: BuilderStageType;
  /**
   * Participating teams in seed order — seed N is `teamIds[N - 1]`, numbered
   * within this stage. Seeds used to run across the whole bracket, which is
   * what made a deleted block leave unusable gaps in the numbering.
   */
  teamIds: string[];
  /** Draw the seed order server-side rather than trusting `teamIds`' order. */
  random: boolean;
  /** Hidden stages are organizer-only. Defaults to visible. */
  public?: boolean;
  /** Vertical ordering on the grid. Lower = higher. */
  order?: number;
  /** Per-round title overrides keyed by global round number. */
  roundTitles?: Record<number, string>;
  /**
   * True once the server has drawn this stage's seeding and matches exist
   * against it. The draw is then permanent — the payload may only append.
   */
  seeded?: boolean;
}

export interface BuilderDraft {
  rounds: BuilderRound[];
  stages: BuilderStage[];
  matches: FlexBracketMatch[];
}

/** The contiguous run of rounds a stage covers on the grid. */
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

/**
 * Which stage a match belongs to.
 *
 * Reads `match.section` because the bracket generator and the read-only canvas
 * still use that field name for "which vertical group". In the builder each
 * group is a stage.
 */
export const stageKeyOf = (match: FlexBracketMatch): string =>
  match.section ?? 'main';

/** Matches in one cell, in display order. */
export function cellMatches(
  matches: FlexBracketMatch[],
  stageKey: string,
  round: number,
): FlexBracketMatch[] {
  return matches
    .filter((m) => stageKeyOf(m) === stageKey && m.round === round)
    .sort((a, b) => a.position - b.position);
}

/**
 * Where each stage sits on the round axis.
 *
 * A stage spans exactly the rounds it holds matches in — never a row above or
 * below. Its size is therefore a consequence of its contents, not something set
 * separately that could drift out of step with them.
 *
 * `emptyAt` places a stage that has no matches yet, which is the one case with
 * nothing to measure: a freshly added stage needs a box to drop its first match
 * into.
 */
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

/**
 * Shifts a whole stage along the round axis, carrying its matches with it.
 *
 * The stage's rounds move together, so the shape it was built with survives the
 * move — this reschedules a block, it never restructures one. Moving off the
 * top is refused rather than clamped, which would silently squash the stage's
 * first two rounds into one.
 */
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

/** True when no match occupies the round — the only kind that may be removed. */
export function roundIsEmpty(draft: BuilderDraft, round: number): boolean {
  return !draft.matches.some((m) => m.round === round);
}

/**
 * Inserts a round at `index`, pushing everything at or after it one row down.
 * Match rounds are global indices, so they shift with the rows.
 */
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

/**
 * Removes an empty round, pulling later rows up. Occupied rounds are returned
 * unchanged rather than silently discarding their matches — the caller is
 * expected to have disabled the action.
 */
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

/**
 * Moves a round to a new position, carrying its matches with it.
 *
 * Every match is remapped through the same permutation as the rounds, so a
 * reorder is purely a change of schedule — nothing is rewired, and a bracket
 * whose wiring the new order contradicts is reported by validation rather than
 * prevented here.
 */
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

  // oldIndex → newIndex, derived from where each round ended up.
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

/** Applies a round-index remap to per-round title overrides. */
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

/**
 * Ensures the round axis is long enough to hold every match, appending
 * placeholder rounds when a drop lands past the end.
 */
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

/**
 * Drops trailing rounds that only exist because a match once needed them.
 *
 * Nudging a stage down and back up would otherwise leave the axis one row
 * longer each time. Only rounds `padRounds` added are reclaimed, and only from
 * the end — anything the organizer named, dated or created by hand stays, as
 * does every round that still holds a match.
 */
export function trimAutoRounds(draft: BuilderDraft): BuilderDraft {
  const lastUsed = draft.matches.reduce((max, m) => Math.max(max, m.round), -1);

  let end = draft.rounds.length;
  while (end - 1 > lastUsed && draft.rounds[end - 1]?.auto) end -= 1;
  if (end === draft.rounds.length) return draft;

  // Never leave the grid with nothing to drop into.
  return { ...draft, rounds: draft.rounds.slice(0, Math.max(1, end)) };
}

/** Marks a round as the organizer's, so it is no longer auto-reclaimable. */
export function claimRound(round: BuilderRound): BuilderRound {
  if (!round.auto) return round;
  const { auto: _auto, ...claimed } = round;
  return claimed;
}

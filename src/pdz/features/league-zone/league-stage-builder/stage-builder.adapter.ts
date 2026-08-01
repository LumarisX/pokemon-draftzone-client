// ─── Loaded tournament bracket ⇄ builder draft ───────────────────────────────
//
// The wire format keeps rounds, stages and matches in three flat lists; the
// builder wants one draft it can edit. Both directions live here so the
// round-index and identity handling stay in one place.

import { FlexBracketMatch } from '../league-bracket/bracket.model';
import {
  TournamentBracket,
  UpdateTournamentBracketPayload,
} from '../league-bracket/tournament-bracket.model';
import {
  BuilderDraft,
  BuilderStage,
  BuilderStageType,
  nextRoundKey,
  padRounds,
  stageKeyOf,
} from './stage-builder.model';

/**
 * Turns a loaded tournament bracket into an editable draft.
 *
 * The tournament's round list is the axis every stage is laid out against, so
 * it carries straight over. A tournament with no bracket yet still gets a
 * one-round axis — the builder needs a row to drop the first match into.
 */
export function toBuilderDraft(bracket: TournamentBracket): BuilderDraft {
  const rounds = (bracket.rounds ?? []).map((round) => ({
    id: round._id,
    name: round.name,
    matchDeadline: round.matchDeadline ?? null,
    tradeDeadline: round.tradeDeadline ?? null,
    bestOf: round.bestOf ?? null,
    key: round._id ?? nextRoundKey(),
  }));

  // Stage id doubles as the grid key for a saved stage: matches name their
  // stage by id on the wire, and the grid groups on the same value.
  const stages: BuilderStage[] = (bracket.stages ?? []).map((stage, index) => ({
    stageId: stage._id,
    key: stage._id,
    name: stage.name,
    type: stage.type as BuilderStageType,
    teamIds: (stage.teams ?? [])
      .slice()
      .sort((a, b) => a.seed - b.seed)
      .map((team) => team.teamId),
    // A stored draw is never re-run, so it is never "random" to submit again.
    random: false,
    public: stage.public,
    order: stage.order ?? index,
    seeded: (stage.teams?.length ?? 0) > 0,
  }));

  const roundIndexById = new Map(
    rounds.map((round, index) => [round.id, index]),
  );

  const matches: FlexBracketMatch[] = (bracket.matches ?? []).map((match) => ({
    id: match._id,
    round: match.round ? (roundIndexById.get(match.round) ?? 0) : 0,
    position: match.position ?? 0,
    section: match.stage ?? 'main',
    a: toSlot(match.a),
    b: toSlot(match.b),
    ...(match.winner !== undefined ? { winner: match.winner } : {}),
    ...(match.replay ? { replay: match.replay } : {}),
    ...(match.label ? { label: match.label } : {}),
  }));

  return padRounds({
    rounds: rounds.length
      ? rounds
      : [{ key: nextRoundKey(), name: 'Round 1' }],
    stages,
    matches,
  });
}

function toSlot(
  slot: { type: string; seed?: number; from?: string } | null,
): FlexBracketMatch['a'] {
  if (!slot) return { type: 'empty' };
  if (slot.type === 'seed') return { type: 'seed', seed: slot.seed ?? 1 };
  if (slot.type === 'winner') return { type: 'winner', from: slot.from ?? '' };
  if (slot.type === 'loser') return { type: 'loser', from: slot.from ?? '' };
  return { type: 'empty' };
}

/**
 * Builds the save payload, carrying server identities through so the diff on
 * the other end updates rather than replaces.
 *
 * Seeds are numbered within their own stage, so no renumbering happens here.
 * They used to run across the whole bracket, which meant deleting one block
 * left gaps the server rejected and the client had to compact away; a stage
 * owning its own seed space removes that problem rather than working around it.
 */
export function toUpdatePayload(
  draft: BuilderDraft,
  savedMatchIds: ReadonlySet<string>,
): UpdateTournamentBracketPayload {
  return {
    rounds: draft.rounds.map((round) => ({
      ...(round.id ? { _id: round.id } : {}),
      name: round.name,
      ...(round.matchDeadline ? { matchDeadline: round.matchDeadline } : {}),
      ...(round.tradeDeadline ? { tradeDeadline: round.tradeDeadline } : {}),
      ...(round.bestOf != null ? { bestOf: round.bestOf } : {}),
    })),
    stages: draft.stages.map((stage) => ({
      ...(stage.stageId ? { _id: stage.stageId } : {}),
      key: stage.key,
      name: stage.name,
      type: stage.type,
      ...(stage.public !== undefined ? { public: stage.public } : {}),
      // A stage whose draw has already happened submits no groups at all:
      // resending them could only ever be a no-op or a rejected re-draw.
      ...(stage.seeded || stage.teamIds.length === 0
        ? {}
        : {
            seedGroups: [
              {
                teamIds: stage.teamIds,
                method: stage.random
                  ? ('certified-random' as const)
                  : ('manual' as const),
                label: stage.name,
              },
            ],
          }),
    })),
    matches: draft.matches.map((match) => ({
      ...(savedMatchIds.has(match.id) ? { _id: match.id } : {}),
      key: match.id,
      stageKey: stageKeyOf(match),
      roundIndex: match.round,
      position: match.position,
      ...(match.label ? { label: match.label } : {}),
      a: toWireSlot(match.a),
      b: toWireSlot(match.b),
    })),
  };
}

/**
 * A bye is a seed the server resolves the same way as any other, and an empty
 * slot cannot be saved — the caller validates wiring before getting here, so
 * this only has to pick a representation, not reject one.
 */
function toWireSlot(slot: FlexBracketMatch['a']): {
  type: 'seed' | 'winner' | 'loser';
  seed?: number;
  from?: string;
} {
  switch (slot.type) {
    case 'seed':
    case 'bye':
      return { type: 'seed', seed: slot.seed };
    case 'winner':
    case 'loser':
      return { type: slot.type, from: slot.from };
    default:
      return { type: 'seed', seed: 1 };
  }
}

/** Ids the server already knows about, so an edit updates instead of recreating. */
export function savedMatchIds(bracket: TournamentBracket): Set<string> {
  return new Set((bracket.matches ?? []).map((m) => m._id));
}

/** Stages holding at least one match — the ones a save will actually persist. */
export function occupiedStages(draft: BuilderDraft): string[] {
  return [...new Set(draft.matches.map(stageKeyOf))];
}

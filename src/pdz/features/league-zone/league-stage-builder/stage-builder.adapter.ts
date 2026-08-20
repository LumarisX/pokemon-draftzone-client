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

export function toBuilderDraft(bracket: TournamentBracket): BuilderDraft {
  const rounds = (bracket.rounds ?? []).map((round) => ({
    id: round._id,
    name: round.name,
    matchDeadline: round.matchDeadline ?? null,
    tradeDeadline: round.tradeDeadline ?? null,
    bestOf: round.bestOf ?? null,
    key: round._id ?? nextRoundKey(),
  }));

  const stages: BuilderStage[] = (bracket.stages ?? []).map((stage, index) => ({
    stageId: stage._id,
    key: stage._id,
    name: stage.name,
    type: stage.type as BuilderStageType,
    teamIds: (stage.teams ?? [])
      .slice()
      .sort((a, b) => a.seed - b.seed)
      .map((team) => team.teamId),
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
    slug: match.slug,
    round: match.round ? (roundIndexById.get(match.round) ?? 0) : 0,
    position: match.position ?? 0,
    section: match.stage ?? 'main',
    a: toSlot(match.a),
    b: toSlot(match.b),
    ...(match.winner !== undefined ? { winner: match.winner } : {}),
    ...(match.replay ? { replay: match.replay } : {}),
    ...(match.replays?.length ? { replays: match.replays } : {}),
    ...(match.score ? { score: match.score } : {}),
    ...(match.forfeit ? { forfeit: match.forfeit } : {}),
    ...(match.advances ? { advances: match.advances } : {}),
    ...(match.label ? { label: match.label } : {}),
  }));

  return padRounds({
    rounds: rounds.length ? rounds : [{ key: nextRoundKey(), name: 'Round 1' }],
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

export function savedMatchIds(bracket: TournamentBracket): Set<string> {
  return new Set((bracket.matches ?? []).map((m) => m._id));
}

export function occupiedStages(draft: BuilderDraft): string[] {
  return [...new Set(draft.matches.map(stageKeyOf))];
}

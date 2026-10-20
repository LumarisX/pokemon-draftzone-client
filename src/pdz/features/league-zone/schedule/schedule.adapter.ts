import { FlexBracketMatch } from './bracket.model';
import {
  TournamentBracket,
  TournamentBracketStage,
  UpdateTournamentBracketPayload,
  UpdateTournamentBracketStage,
} from './tournament-bracket.model';
import {
  ScheduleDraft,
  ScheduleEntrant,
  ScheduleStage,
  ScheduleStageType,
  ScheduleTeam,
  StageProjection,
  padRounds,
  stageKeyOf,
} from './schedule.model';

function entrantsOf(stage: TournamentBracketStage): ScheduleEntrant[] {
  if (stage.entrants?.length) {
    return stage.entrants.map((entrant) => {
      if (entrant.kind === 'place')
        return {
          kind: 'place',
          sourceStageKey: entrant.sourceStageId ?? undefined,
          place: entrant.place ?? 1,
          teamId: entrant.teamId,
        };
      return { kind: entrant.kind, teamId: entrant.teamId };
    });
  }
  return stage.teams
    .slice()
    .sort((a, b) => a.seed - b.seed)
    .map((team) => ({ kind: 'team', teamId: team.teamId }));
}

export function toScheduleDraft(bracket: TournamentBracket): ScheduleDraft {
  const rounds = (bracket.rounds ?? []).map((round) => ({
    key: round._id,
    id: round._id,
    name: round.name,
    matchDeadline: round.matchDeadline ?? null,
    tradeDeadline: round.tradeDeadline ?? null,
  }));
  const roundIndexById = new Map(rounds.map((round, index) => [round.id, index]));

  const stages: ScheduleStage[] = (bracket.stages ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((stage) => ({
      key: stage._id,
      stageId: stage._id,
      name: stage.name,
      type: stage.type as ScheduleStageType,
      public: stage.public,
      entrants: entrantsOf(stage),
      random: false,
      drawn: !stage.entrants?.length && stage.teams.length > 0,
      storesEntrants: !!stage.entrants?.length,
      entrantsChanged: false,
    }));

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
    ...(match.scheduledDate ? { scheduledDate: match.scheduledDate } : {}),
  }));

  return padRounds({
    rounds: rounds.length
      ? rounds
      : [{ key: 'round-initial', name: 'Week 1', auto: true }],
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

export function teamsFromBracket(
  bracket: TournamentBracket,
): Map<string, ScheduleTeam> {
  const teams = new Map<string, ScheduleTeam>();
  for (const stage of bracket.stages ?? []) {
    for (const team of stage.teams) {
      teams.set(team.teamId, {
        teamId: team.teamId,
        teamName: team.teamName,
        coachName: team.coachName,
        logo: team.logo,
        teamSlug: team.teamSlug,
      });
    }
  }
  for (const projection of bracket.projections ?? []) {
    for (const row of projection.standings) {
      if (teams.has(row.teamId)) continue;
      teams.set(row.teamId, {
        teamId: row.teamId,
        teamName: row.teamName,
        coachName: row.coachName,
        logo: row.logo,
        teamSlug: row.teamSlug,
      });
    }
  }
  return teams;
}

export function projectionsFromBracket(
  bracket: TournamentBracket,
): Map<string, StageProjection> {
  return new Map(
    (bracket.projections ?? []).map((projection) => [
      projection.stageId,
      projection,
    ]),
  );
}

function entrantsPayload(
  stage: ScheduleStage,
): UpdateTournamentBracketStage['entrants'] {
  return stage.entrants.map((entrant) => {
    if (entrant.kind === 'team')
      return { kind: 'team', teamId: entrant.teamId ?? undefined };
    if (entrant.kind === 'place')
      return {
        kind: 'place',
        sourceStageKey: entrant.sourceStageKey,
        place: entrant.place,
      };
    return { kind: 'open' };
  });
}

function seedingFor(
  stage: ScheduleStage,
): Pick<UpdateTournamentBracketStage, 'entrants' | 'seedGroups'> {
  const allTeams = stage.entrants.every(
    (entrant) => entrant.kind === 'team' && entrant.teamId,
  );
  if (stage.storesEntrants || !allTeams) {
    if (stage.storesEntrants && !stage.entrantsChanged) return {};
    return { entrants: entrantsPayload(stage) };
  }
  if (stage.entrants.length === 0) return {};
  if (stage.drawn && !stage.entrantsChanged) return {};
  return {
    seedGroups: [
      {
        teamIds: stage.entrants.map((entrant) => entrant.teamId!),
        method: stage.random && !stage.drawn ? 'certified-random' : 'manual',
        label: stage.name,
      },
    ],
  };
}

export function toUpdatePayload(
  draft: ScheduleDraft,
  savedMatchIds: ReadonlySet<string>,
): UpdateTournamentBracketPayload {
  return {
    rounds: draft.rounds.map((round) => ({
      ...(round.id ? { _id: round.id } : {}),
      name: round.name,
      ...(round.matchDeadline ? { matchDeadline: round.matchDeadline } : {}),
      ...(round.tradeDeadline ? { tradeDeadline: round.tradeDeadline } : {}),
    })),
    stages: draft.stages.map((stage) => ({
      ...(stage.stageId ? { _id: stage.stageId } : {}),
      key: stage.key,
      name: stage.name,
      type: stage.type,
      public: stage.public,
      ...seedingFor(stage),
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
      return { type: 'seed', seed: 0 };
  }
}

export function savedMatchIds(bracket: TournamentBracket): Set<string> {
  return new Set((bracket.matches ?? []).map((match) => match._id));
}

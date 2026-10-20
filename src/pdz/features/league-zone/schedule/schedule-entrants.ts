import {
  ScheduleDraft,
  ScheduleEntrant,
  ScheduleStage,
  ScheduleTeam,
  StageProjection,
  ordinal,
  stageMatches,
} from './schedule.model';

export interface ScheduleContext {
  teams: ReadonlyMap<string, ScheduleTeam>;
  projections: ReadonlyMap<string, StageProjection>;
  stages: readonly ScheduleStage[];
}

export interface ResolvedEntrant {
  team: ScheduleTeam | null;
  label: string;
  detail: string | null;
  kind: ScheduleEntrant['kind'] | 'missing';
}

export function stageName(context: ScheduleContext, key?: string): string {
  return context.stages.find((stage) => stage.key === key)?.name ?? 'Another stage';
}

export function placeLabel(
  context: ScheduleContext,
  entrant: ScheduleEntrant,
): string {
  return `${stageName(context, entrant.sourceStageKey)} · ${ordinal(entrant.place ?? 1)}`;
}

export function projectedTeam(
  context: ScheduleContext,
  entrant: ScheduleEntrant,
): ScheduleTeam | null {
  if (entrant.kind !== 'place' || !entrant.sourceStageKey) return null;
  const row =
    context.projections.get(entrant.sourceStageKey)?.standings[
      (entrant.place ?? 1) - 1
    ];
  return row ? (context.teams.get(row.teamId) ?? null) : null;
}

export function resolveEntrant(
  context: ScheduleContext,
  stage: ScheduleStage,
  seed: number,
): ResolvedEntrant {
  const entrant = stage.entrants[seed - 1];
  if (!entrant)
    return { team: null, label: `Seed ${seed}`, detail: null, kind: 'missing' };

  const team = entrant.teamId ? (context.teams.get(entrant.teamId) ?? null) : null;

  if (entrant.kind === 'team') {
    if (stage.random && !stage.drawn)
      return {
        team: null,
        label: `Seed ${seed}`,
        detail: 'Drawn when you save',
        kind: 'team',
      };
    return {
      team,
      label: team?.teamName ?? `Seed ${seed}`,
      detail: team?.coachName ?? null,
      kind: 'team',
    };
  }

  if (entrant.kind === 'place') {
    const label = placeLabel(context, entrant);
    if (team) return { team, label: team.teamName, detail: label, kind: 'place' };
    const now = projectedTeam(context, entrant);
    return {
      team: null,
      label,
      detail: now ? `Now: ${now.teamName}` : 'Decided when it ends',
      kind: 'place',
    };
  }

  if (team) return { team, label: team.teamName, detail: 'Open slot', kind: 'open' };
  return { team: null, label: 'Open Slot', detail: 'Pick a team later', kind: 'open' };
}

export function pendingSeeds(stage: ScheduleStage): number[] {
  return stage.entrants
    .map((entrant, index) => ({ entrant, seed: index + 1 }))
    .filter(({ entrant }) => entrant.kind !== 'team' && !entrant.teamId)
    .map(({ seed }) => seed);
}

export function sourceStagesOf(
  context: ScheduleContext,
  stage: ScheduleStage,
): ScheduleStage[] {
  const keys = new Set(
    stage.entrants
      .filter((entrant) => entrant.kind === 'place' && !entrant.teamId)
      .map((entrant) => entrant.sourceStageKey),
  );
  return context.stages.filter((s) => keys.has(s.key));
}

export function sourcesComplete(
  context: ScheduleContext,
  draft: ScheduleDraft,
  stage: ScheduleStage,
): boolean {
  const sources = sourceStagesOf(context, stage);
  return (
    sources.length > 0 &&
    sources.every((source) => {
      const projection = context.projections.get(source.key);
      if (projection) return projection.complete;
      const matches = stageMatches(draft, source.key);
      return matches.length > 0 && matches.every((m) => m.winner !== undefined);
    })
  );
}

export function usedTeams(
  stages: readonly ScheduleStage[],
  exceptKey?: string,
): Map<string, string> {
  const used = new Map<string, string>();
  for (const stage of stages) {
    if (stage.key === exceptKey) continue;
    for (const entrant of stage.entrants)
      if (entrant.kind === 'team' && entrant.teamId)
        used.set(entrant.teamId, stage.name);
  }
  return used;
}

export function placesFrom(
  sources: readonly ScheduleStage[],
  top: number,
  order: 'by-place' | 'by-stage',
): ScheduleEntrant[] {
  const count = Math.max(0, Math.min(64, Math.floor(top) || 0));
  const out: ScheduleEntrant[] = [];
  if (order === 'by-stage' || sources.length < 2) {
    for (const source of sources)
      for (let place = 1; place <= count; place++)
        out.push({ kind: 'place', sourceStageKey: source.key, place });
    return out;
  }
  for (let place = 1; place <= count; place++)
    for (const source of sources)
      out.push({ kind: 'place', sourceStageKey: source.key, place });
  return out;
}

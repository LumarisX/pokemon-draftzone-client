import { BracketSlotFlex, FlexBracketMatch } from './bracket.model';
import {
  ScheduleDraft,
  ScheduleStage,
  nextLocalKey,
  stageKeyOf,
  stageSpan,
} from './schedule.model';

function inGroup(
  matches: readonly FlexBracketMatch[],
  stageKey: string,
  round: number,
): FlexBracketMatch[] {
  return matches
    .filter((m) => stageKeyOf(m) === stageKey && m.round === round)
    .sort((a, b) => a.position - b.position);
}

export function addMatchToRound(
  matches: readonly FlexBracketMatch[],
  stageKey: string,
  round: number,
): FlexBracketMatch[] {
  return [
    ...matches,
    {
      id: nextLocalKey('match'),
      section: stageKey,
      round,
      position: inGroup(matches, stageKey, round).length,
      a: { type: 'empty' },
      b: { type: 'empty' },
    },
  ];
}

export function deleteMatch(
  matches: readonly FlexBracketMatch[],
  matchId: string,
): FlexBracketMatch[] {
  const clear = (slot: BracketSlotFlex): BracketSlotFlex =>
    (slot.type === 'winner' || slot.type === 'loser') && slot.from === matchId
      ? { type: 'empty' }
      : slot;
  return matches
    .filter((m) => m.id !== matchId)
    .map((m) => ({ ...m, a: clear(m.a), b: clear(m.b) }));
}

export function moveMatch(
  matches: readonly FlexBracketMatch[],
  matchId: string,
  toStage: string,
  toRound: number,
  toIndex: number,
): FlexBracketMatch[] {
  const moving = matches.find((m) => m.id === matchId);
  if (!moving) return [...matches];

  const fromStage = stageKeyOf(moving);
  const sameGroup = fromStage === toStage && moving.round === toRound;
  const destination = inGroup(matches, toStage, toRound).filter(
    (m) => m.id !== matchId,
  );
  const index = Math.max(0, Math.min(toIndex, destination.length));
  destination.splice(index, 0, moving);
  const destinationPosition = new Map(destination.map((m, i) => [m.id, i]));
  const sourcePosition = sameGroup
    ? new Map<string, number>()
    : new Map(
        inGroup(matches, fromStage, moving.round)
          .filter((m) => m.id !== matchId)
          .map((m, i) => [m.id, i]),
      );

  return matches.map((m) => {
    if (m.id === matchId)
      return { ...m, section: toStage, round: toRound, position: index };
    if (destinationPosition.has(m.id))
      return { ...m, position: destinationPosition.get(m.id)! };
    if (sourcePosition.has(m.id))
      return { ...m, position: sourcePosition.get(m.id)! };
    return m;
  });
}

export function updateStage(
  draft: ScheduleDraft,
  key: string,
  change: Partial<ScheduleStage>,
): ScheduleDraft {
  return {
    ...draft,
    stages: draft.stages.map((stage) =>
      stage.key === key ? { ...stage, ...change } : stage,
    ),
  };
}

export function removeStage(draft: ScheduleDraft, key: string): ScheduleDraft {
  const doomed = new Set(
    draft.matches.filter((match) => stageKeyOf(match) === key).map((m) => m.id),
  );
  const clear = (slot: BracketSlotFlex): BracketSlotFlex =>
    (slot.type === 'winner' || slot.type === 'loser') && doomed.has(slot.from)
      ? { type: 'empty' }
      : slot;
  return {
    ...draft,
    stages: draft.stages
      .filter((stage) => stage.key !== key)
      .map((stage) =>
        stage.entrants.some(
          (entrant) => entrant.kind === 'place' && entrant.sourceStageKey === key,
        )
          ? {
              ...stage,
              entrantsChanged: true,
              entrants: stage.entrants.map((entrant) =>
                entrant.kind === 'place' && entrant.sourceStageKey === key
                  ? { kind: 'open' as const }
                  : entrant,
              ),
            }
          : stage,
      ),
    matches: draft.matches
      .filter((match) => !doomed.has(match.id))
      .map((match) => ({ ...match, a: clear(match.a), b: clear(match.b) })),
  };
}

export function addMatch(
  draft: ScheduleDraft,
  stageKey: string,
  round: number,
): ScheduleDraft {
  return {
    ...draft,
    matches: addMatchToRound(draft.matches, stageKey, round),
  };
}

export function removeMatch(draft: ScheduleDraft, matchId: string): ScheduleDraft {
  return { ...draft, matches: deleteMatch(draft.matches, matchId) };
}

export function moveMatchToRound(
  draft: ScheduleDraft,
  matchId: string,
  round: number,
): ScheduleDraft {
  const match = draft.matches.find((m) => m.id === matchId);
  if (!match || match.round === round) return draft;
  return {
    ...draft,
    matches: moveMatch(
      draft.matches,
      matchId,
      stageKeyOf(match),
      round,
      Number.MAX_SAFE_INTEGER,
    ),
  };
}

export function setSide(
  draft: ScheduleDraft,
  matchId: string,
  side: 'a' | 'b',
  slot: BracketSlotFlex,
): ScheduleDraft {
  return {
    ...draft,
    matches: draft.matches.map((match) =>
      match.id === matchId ? { ...match, [side]: slot } : match,
    ),
  };
}

export function swapSides(draft: ScheduleDraft, matchId: string): ScheduleDraft {
  return {
    ...draft,
    matches: draft.matches.map((match) =>
      match.id === matchId ? { ...match, a: match.b, b: match.a } : match,
    ),
  };
}

export function replaceStageMatches(
  draft: ScheduleDraft,
  stageKey: string,
  matches: ScheduleDraft['matches'],
): ScheduleDraft {
  return {
    ...draft,
    matches: [
      ...draft.matches.filter((match) => stageKeyOf(match) !== stageKey),
      ...matches,
    ],
  };
}

export function stageHasResults(draft: ScheduleDraft, stageKey: string): boolean {
  return draft.matches.some(
    (match) =>
      stageKeyOf(match) === stageKey &&
      (match.winner !== undefined || !!match.advances || !!match.forfeit),
  );
}

export function startOf(draft: ScheduleDraft, stage: ScheduleStage): number {
  return stageSpan(draft, stage).first;
}

export function slotValue(slot: BracketSlotFlex): string {
  switch (slot.type) {
    case 'seed':
    case 'bye':
      return `seed:${slot.seed}`;
    case 'winner':
    case 'loser':
      return `${slot.type}:${slot.from}`;
    default:
      return 'empty';
  }
}

export function slotFromValue(value: string): BracketSlotFlex {
  const at = value.indexOf(':');
  if (at < 0) return { type: 'empty' };
  const type = value.slice(0, at);
  const rest = value.slice(at + 1);
  if (type === 'seed') return { type: 'seed', seed: Number(rest) };
  if (type === 'winner' || type === 'loser') return { type, from: rest };
  return { type: 'empty' };
}

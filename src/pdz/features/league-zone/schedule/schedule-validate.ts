import { FlexBracketMatch } from './bracket.model';
import {
  ScheduleDraft,
  matchLabels,
  stageKeyOf,
} from './schedule.model';

const REPLAYS_SEEDS = new Set(['round-robin', 'swiss']);

export function validateSchedule(draft: ScheduleDraft): string[] {
  const errors: string[] = [];
  const labels = matchLabels(draft);
  const stages = new Map(draft.stages.map((stage) => [stage.key, stage]));
  const name = (match: FlexBracketMatch) =>
    `${stages.get(stageKeyOf(match))?.name ?? 'A stage'} ${labels.get(match.id) ?? 'match'}`;

  const byId = new Map<string, FlexBracketMatch>();
  for (const match of draft.matches) {
    if (byId.has(match.id)) errors.push(`${name(match)} appears twice`);
    byId.set(match.id, match);
  }

  const tbd = draft.matches.filter(
    (match) => match.a.type === 'empty' || match.b.type === 'empty',
  );
  if (tbd.length)
    errors.push(
      `${tbd.length === 1 ? '1 match has' : `${tbd.length} matches have`} a side set to TBD (${tbd
        .slice(0, 3)
        .map(name)
        .join(', ')}). Set every side before saving.`,
    );

  const entered = new Set<string>();
  const consumed = new Set<string>();
  for (const match of draft.matches) {
    const stage = stages.get(stageKeyOf(match));
    for (const slot of [match.a, match.b]) {
      if (slot.type === 'seed' || slot.type === 'bye') {
        if (!stage) continue;
        if (slot.seed > stage.entrants.length) {
          errors.push(
            `${name(match)} uses seed ${slot.seed}, but ${stage.name} has ${stage.entrants.length} entrants`,
          );
          continue;
        }
        if (REPLAYS_SEEDS.has(stage.type)) continue;
        const key = `${stage.key}:${slot.seed}`;
        if (entered.has(key))
          errors.push(`Seed ${slot.seed} enters ${stage.name} more than once`);
        entered.add(key);
        continue;
      }
      if (slot.type !== 'winner' && slot.type !== 'loser') continue;
      if (slot.from === match.id) {
        errors.push(`${name(match)} is fed by itself`);
        continue;
      }
      const source = byId.get(slot.from);
      if (!source) {
        errors.push(`${name(match)} is fed by a match that no longer exists`);
        continue;
      }
      const edge = `${slot.type}:${slot.from}`;
      if (consumed.has(edge))
        errors.push(`The ${slot.type} of ${name(source)} goes to two matches`);
      consumed.add(edge);
    }
  }

  const state = new Map<string, 'visiting' | 'done'>();
  const cycles = (id: string): boolean => {
    if (state.get(id) === 'done') return false;
    if (state.get(id) === 'visiting') return true;
    state.set(id, 'visiting');
    const match = byId.get(id);
    for (const slot of match ? [match.a, match.b] : []) {
      if ((slot.type === 'winner' || slot.type === 'loser') && byId.has(slot.from) && cycles(slot.from))
        return true;
    }
    state.set(id, 'done');
    return false;
  };
  const looped = draft.matches.find((match) => cycles(match.id));
  if (looped) errors.push(`${name(looped)} feeds itself through a loop of matches`);

  return errors;
}

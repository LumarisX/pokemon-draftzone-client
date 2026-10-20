import { BracketSlotFlex, FlexBracketMatch } from './bracket.model';
import { ScheduleTeam } from './schedule.model';

export interface MatchExit {
  winner: 0 | 1 | null;
  loser: 0 | 1 | null;
  settled: boolean;
  walkover: 0 | 1 | 'void' | null;
}

const OPEN: MatchExit = {
  winner: null,
  loser: null,
  settled: false,
  walkover: null,
};
const NOBODY: MatchExit = { ...OPEN, settled: true };

function recordedWinner(match: FlexBracketMatch): 0 | 1 | null | undefined {
  if (match.advances === 'none') return null;
  if (match.advances === 'side1') return 0;
  if (match.advances === 'side2') return 1;
  if (match.winner !== undefined) return match.winner;
  if (match.forfeit) return null;
  return undefined;
}

export function matchExit(
  match: FlexBracketMatch,
  matches: readonly FlexBracketMatch[] = [],
  depth = 0,
): MatchExit {
  const recorded = recordedWinner(match);
  if (recorded === null) return NOBODY;
  if (recorded !== undefined)
    return {
      winner: recorded,
      loser: recorded === 0 ? 1 : 0,
      settled: true,
      walkover: null,
    };
  if (depth > 20) return OPEN;

  const isDead = (slot: BracketSlotFlex): boolean => {
    if (slot.type !== 'winner' && slot.type !== 'loser') return false;
    const source = matches.find((m) => m.id === slot.from);
    if (!source) return false;
    const exit = matchExit(source, matches, depth + 1);
    return exit.settled && exit[slot.type] === null;
  };

  const deadA = isDead(match.a);
  const deadB = isDead(match.b);
  if (deadA && deadB) return { ...NOBODY, walkover: 'void' };
  if (deadA) return { winner: 1, loser: null, settled: true, walkover: 1 };
  if (deadB) return { winner: 0, loser: null, settled: true, walkover: 0 };
  return OPEN;
}

export interface SeedView {
  team: ScheduleTeam | null;
  label: string;
  detail: string | null;
}

export interface SideView {
  team: ScheduleTeam | null;
  name: string;
  detail: string | null;
  sourceId: string | null;
}

export interface SideInput {
  matches: readonly FlexBracketMatch[];
  labels: ReadonlyMap<string, string>;
  seed: (match: FlexBracketMatch, seed: number) => SeedView;
}

export function resolveSide(
  input: SideInput,
  match: FlexBracketMatch,
  key: 'a' | 'b',
  depth = 0,
): SideView {
  const slot = match[key];
  if (depth > 20) return { team: null, name: 'TBD', detail: null, sourceId: null };

  if (slot.type === 'seed' || slot.type === 'bye') {
    const seed = input.seed(match, slot.seed);
    return {
      team: seed.team,
      name: seed.team?.teamName ?? seed.label,
      detail: seed.team ? seed.team.coachName : seed.detail,
      sourceId: null,
    };
  }

  if (slot.type === 'winner' || slot.type === 'loser') {
    const label = input.labels.get(slot.from) ?? slot.from;
    const word = slot.type === 'winner' ? 'Winner' : 'Loser';
    const source = input.matches.find((m) => m.id === slot.from);
    if (source) {
      const exit = matchExit(source, input.matches);
      const index = exit[slot.type];
      if (index !== null) {
        const through = resolveSide(input, source, index === 0 ? 'a' : 'b', depth + 1);
        return through.team
          ? { ...through, detail: `${slot.type === 'winner' ? 'Won' : 'Lost'} ${label}` }
          : through;
      }
      if (exit.settled) {
        const doubleForfeit =
          source.winner === undefined && source.forfeit && !source.advances;
        return {
          team: null,
          name: doubleForfeit
            ? `Double forfeit in ${label}`
            : `No ${word.toLowerCase()} from ${label}`,
          detail: null,
          sourceId: slot.from,
        };
      }
    }
    return { team: null, name: `${word} of ${label}`, detail: null, sourceId: slot.from };
  }

  return { team: null, name: 'TBD', detail: null, sourceId: null };
}

import { FlexBracketMatch } from './bracket.model';
import { SideInput, matchExit, resolveSide } from './schedule-sides';

const seed = (n: number) => ({ type: 'seed', seed: n }) as const;
const winnerOf = (from: string) => ({ type: 'winner', from }) as const;
const loserOf = (from: string) => ({ type: 'loser', from }) as const;

const NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

function input(
  matches: FlexBracketMatch[],
  labels: Record<string, string> = {},
  known = 5,
): SideInput {
  return {
    matches,
    labels: new Map(Object.entries(labels)),
    seed: (_, n) =>
      n <= known
        ? {
            team: { teamId: `t${n}`, teamName: NAMES[n - 1], coachName: 'Coach' },
            label: NAMES[n - 1],
            detail: null,
          }
        : { team: null, label: `Seed ${n}`, detail: null },
  };
}

const fourTeams = (): FlexBracketMatch[] => [
  { id: 's1', round: 0, position: 0, a: seed(1), b: seed(4) },
  { id: 's2', round: 0, position: 1, a: seed(2), b: seed(3) },
  { id: 'f', round: 1, position: 0, a: winnerOf('s1'), b: winnerOf('s2') },
];

const holder = (slot: FlexBracketMatch['a']): FlexBracketMatch => ({
  id: 'probe',
  round: 9,
  position: 0,
  a: slot,
  b: { type: 'empty' },
});

const side = (matches: FlexBracketMatch[], slot: FlexBracketMatch['a'], labels = {}) =>
  resolveSide(input(matches, labels), holder(slot), 'a');

describe('resolveSide', () => {
  it('resolves seeds and follows a winner once the match is decided', () => {
    const matches = fourTeams();
    expect(side(matches, seed(1)).team?.teamName).toBe('Alpha');
    expect(side(matches, winnerOf('s1')).team).toBeNull();
    matches[0].winner = 1;
    const decided = side(matches, winnerOf('s1'), { s1: 'Match 1' });
    expect(decided.team?.teamName).toBe('Delta');
    expect(decided.detail).toBe('Won Match 1');
  });

  it('labels pending winner and loser slots with the source label', () => {
    const labels = { s1: 'Match 1' };
    expect(side(fourTeams(), winnerOf('s1'), labels).name).toBe('Winner of Match 1');
    expect(side(fourTeams(), loserOf('s1'), labels).name).toBe('Loser of Match 1');
  });

  it('names a double forfeit instead of promising a winner', () => {
    const matches = fourTeams();
    matches[0].forfeit = true;
    const resolved = side(matches, winnerOf('s1'), { s1: 'Match 1' });
    expect(resolved.team).toBeNull();
    expect(resolved.name).toBe('Double forfeit in Match 1');
    expect(resolved.sourceId).toBe('s1');
  });

  it('advances the side an organizer picked, and routes the other to the loser slot', () => {
    const matches = fourTeams();
    matches[0].forfeit = true;
    matches[0].advances = 'side2';
    expect(side(matches, winnerOf('s1')).team?.teamName).toBe('Delta');
    expect(side(matches, loserOf('s1')).team?.teamName).toBe('Alpha');
  });

  it('says nobody advances once an organizer rules so', () => {
    const matches = fourTeams();
    matches[0].forfeit = true;
    matches[0].advances = 'none';
    expect(side(matches, winnerOf('s1'), { s1: 'Match 1' }).name).toBe(
      'No winner from Match 1',
    );
    expect(side(matches, loserOf('s1'), { s1: 'Match 1' }).name).toBe(
      'No loser from Match 1',
    );
  });

  it('walks a team past a match two double forfeits feed', () => {
    const matches: FlexBracketMatch[] = [
      { id: 'm2', round: 0, position: 0, a: seed(1), b: seed(2), forfeit: true },
      { id: 'm3', round: 0, position: 1, a: seed(3), b: seed(4), forfeit: true },
      { id: 'm13', round: 1, position: 0, a: winnerOf('m2'), b: winnerOf('m3') },
      { id: 'm21', round: 2, position: 0, a: winnerOf('m13'), b: seed(5) },
    ];
    expect(side(matches, winnerOf('m13'), { m13: 'Match 13' }).name).toBe(
      'No winner from Match 13',
    );
    expect(matchExit(matches[2], matches).walkover).toBe('void');
    expect(side(matches, winnerOf('m21')).team?.teamName).toBe('Echo');
  });

  it('gives the side still standing a walkover and leaves the loser slot empty', () => {
    const matches = fourTeams();
    matches[0].forfeit = true;
    matches[1].winner = 0;
    expect(matchExit(matches[2], matches)).toEqual({
      winner: 1,
      loser: null,
      settled: true,
      walkover: 1,
    });
    expect(side(matches, loserOf('f'), { f: 'Final' }).name).toBe('No loser from Final');
  });

  it('lets an organizer ruling on a walkover stand', () => {
    const matches = fourTeams();
    matches[0].forfeit = true;
    matches[2].advances = 'none';
    expect(matchExit(matches[2], matches).walkover).toBeNull();
    expect(matchExit(matches[2], matches).winner).toBeNull();
  });

  it('overrules a recorded winner when an override disagrees', () => {
    const matches = fourTeams();
    matches[0].winner = 0;
    matches[0].advances = 'side2';
    expect(side(matches, winnerOf('s1')).team?.teamName).toBe('Delta');
  });

  it('does not hang on a cycle', () => {
    const matches: FlexBracketMatch[] = [
      { id: 'a', round: 0, position: 0, a: winnerOf('b'), b: seed(1) },
      { id: 'b', round: 0, position: 1, a: winnerOf('a'), b: seed(2) },
    ];
    expect(() => side(matches, winnerOf('a'))).not.toThrow();
  });

  it('shows TBD for an empty side and the seed label for an unknown seed', () => {
    expect(side([], { type: 'empty' }).name).toBe('TBD');
    expect(side([], seed(9)).name).toBe('Seed 9');
  });
});

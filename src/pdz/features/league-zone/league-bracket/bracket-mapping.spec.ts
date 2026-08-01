import {
  mapRawBracket,
  RawBracketMatch,
  RawBracketResponse,
} from './bracket-mapping';

const round = (id: string, name: string, matchDeadline: string | null = null) =>
  ({ _id: id, name, matchDeadline }) as const;

const match = (
  id: string,
  roundId: string,
  overrides: Partial<RawBracketMatch> = {},
): RawBracketMatch => ({
  _id: id,
  round: roundId,
  roundName: 'Round',
  a: { type: 'seed', seed: 1 },
  b: { type: 'seed', seed: 2 },
  ...overrides,
});

const response = (over: Partial<RawBracketResponse> = {}): RawBracketResponse =>
  ({
    format: 'double-elimination',
    teams: [],
    rounds: [],
    matches: [],
    ...over,
  }) as RawBracketResponse;

describe('mapRawBracket round axis', () => {
  it('indexes matches by the stage round list, not by bracketRound', () => {
    // A legacy double-elim: the losers section numbered its own rounds from 0,
    // but on the stage's flat list those rounds come after the winners rounds.
    const raw = response({
      rounds: [
        round('r0', 'Winners Round 1'),
        round('r1', 'Losers Round 1'),
        round('r2', 'Grand Finals'),
      ],
      matches: [
        match('m1', 'r0', { section: 'winners', bracketRound: 0 }),
        match('m2', 'r1', { section: 'losers', bracketRound: 0 }),
        match('m3', 'r2', { section: 'finals', bracketRound: 0 }),
      ],
    });

    const mapped = mapRawBracket(raw);
    const roundOf = (id: string) =>
      mapped.matches.find((m) => m.id === id)!.round;

    // All three carried bracketRound 0; only the global axis separates them.
    expect(roundOf('m1')).toBe(0);
    expect(roundOf('m2')).toBe(1);
    expect(roundOf('m3')).toBe(2);
  });

  it('falls back to bracketRound when a matchup has no round reference', () => {
    const raw = response({
      rounds: [round('r0', 'Round 1')],
      matches: [match('m1', 'missing-round', { bracketRound: 2 })],
    });
    expect(mapRawBracket(raw).matches[0].round).toBe(2);
  });

  it('exposes the round axis with names and deadlines', () => {
    const raw = response({
      rounds: [
        { ...round('r0', 'Week 1', '2026-08-07T00:00:00.000Z'), bestOf: 3 },
        round('r1', 'Week 2'),
      ],
      matches: [match('m1', 'r0')],
    });

    const { rounds } = mapRawBracket(raw);
    expect(rounds?.map((r) => r.name)).toEqual(['Week 1', 'Week 2']);
    expect(rounds?.[0].matchDeadline).toBe('2026-08-07T00:00:00.000Z');
    expect(rounds?.[0].bestOf).toBe(3);
    expect(rounds?.[1].bestOf).toBe(null);
  });

  it('returns the round axis even when the stage has no matches yet', () => {
    const raw = response({
      format: null,
      rounds: [round('r0', 'Week 1')],
    });
    const mapped = mapRawBracket(raw);
    expect(mapped.matches.length).toBe(0);
    expect(mapped.rounds?.map((r) => r.name)).toEqual(['Week 1']);
  });

  it('numbers positions per (section, global round) cell', () => {
    const raw = response({
      rounds: [round('r0', 'Round 1')],
      matches: [
        match('m1', 'r0', { section: 'a' }),
        match('m2', 'r0', { section: 'a' }),
        match('m3', 'r0', { section: 'b' }),
      ],
    });
    const positions = mapRawBracket(raw).matches.map((m) => m.position);
    // Section b restarts at 0 — it is a different cell on the same row.
    expect(positions).toEqual([0, 1, 0]);
  });
});

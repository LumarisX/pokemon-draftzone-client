import { League } from '@pdz/features/league-zone/league.interface';
import { seasonRows } from './team-season.component';

function side(slug: string | null, score = 0): League.MatchupSide {
  return {
    id: slug,
    slug,
    name: slug ? `Team ${slug}` : '',
    coach: slug ? `Coach ${slug}` : '',
    logo: '',
    score,
    draft: [],
    from: slug ? null : { slug: 'm9', label: 'Winner of Match 9' },
  } as unknown as League.MatchupSide;
}

function round(
  name: string,
  team1: League.MatchupSide,
  team2: League.MatchupSide,
  winner?: League.MatchupWinner,
): League.ScheduleRound {
  return {
    _id: name,
    name,
    stages: [
      {
        _id: 's',
        slug: 's',
        name: 'Pool A',
        type: 'rr',
        matchups: [
          { id: name, slug: name, team1, team2, matches: [], winner },
        ],
      },
    ],
  };
}

const BASE = ['/', 'leagues', 'kanto', 'tournaments', 's3'];

describe('seasonRows', () => {
  it('reads results and scores from the team’s own side', () => {
    const rows = seasonRows(
      [
        round('R1', side('me', 2), side('a', 1), 'side1'),
        round('R2', side('b', 2), side('me', 0), 'side1'),
        round('R3', side('c', 1), side('me', 1), 'draw'),
      ],
      'me',
      3,
      BASE,
    );

    expect(rows.map((row) => row.result)).toEqual(['win', 'loss', 'draw']);
    expect(rows[1].score).toEqual({ mine: 0, theirs: 2 });
    expect(rows[1].opponent.name).toBe('Team b');
    expect(rows[1].link).toEqual([...BASE, 'matchups', 'R2']);
  });

  it('counts a double forfeit as a loss and marks forfeits', () => {
    const [row] = seasonRows(
      [round('R1', side('me'), side('a'), 'dffl')],
      'me',
      0,
      BASE,
    );

    expect(row.result).toBe('loss');
    expect(row.forfeit).toBe(true);
  });

  it('marks the undecided match in the current round as next', () => {
    const rows = seasonRows(
      [
        round('R1', side('me'), side('a')),
        round('R2', side('me'), side('b')),
      ],
      'me',
      1,
      BASE,
    );

    expect(rows.map((row) => row.next)).toEqual([false, true]);
  });

  it('falls back to the first undecided match when the current round is played', () => {
    const rows = seasonRows(
      [
        round('R1', side('me', 2), side('a'), 'side1'),
        round('R2', side('me'), side('b')),
      ],
      'me',
      0,
      BASE,
    );

    expect(rows.map((row) => row.next)).toEqual([false, true]);
  });

  it('names an opponent that is not decided yet and gives it no link', () => {
    const [row] = seasonRows(
      [round('R1', side('me'), side(null))],
      'me',
      0,
      BASE,
    );

    expect(row.opponent.name).toBe('Winner of Match 9');
    expect(row.link).toBeNull();
  });
});

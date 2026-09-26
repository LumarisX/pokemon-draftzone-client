import { toTournamentUrl } from './legacy-tournament-redirect.guard';

describe('toTournamentUrl', () => {
  it('drops the league from a tournament URL', () => {
    expect(toTournamentUrl('/leagues/pdz/tournaments/spring01')).toBe(
      '/tournaments/spring01',
    );
  });

  it('keeps the child path, query string and fragment', () => {
    expect(
      toTournamentUrl(
        '/leagues/pdz/tournaments/spring01/sign-up?invite=abc#rules',
      ),
    ).toBe('/tournaments/spring01/sign-up?invite=abc#rules');
  });

  it('leaves other URLs alone', () => {
    expect(toTournamentUrl('/leagues/pdz')).toBe('/leagues/pdz');
    expect(toTournamentUrl('/tournaments/spring01')).toBe(
      '/tournaments/spring01',
    );
  });
});

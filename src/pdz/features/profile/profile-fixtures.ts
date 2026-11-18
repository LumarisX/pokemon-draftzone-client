import { Profile } from './profile.model';

export const EMPTY_PROFILE: Profile = {
  career: {
    wins: 0,
    draws: 0,
    losses: 0,
    seasons: 0,
    winRate: null,
    titles: 0,
    best: null,
  },
  completed: [],
  achievements: [],
};

export const FULL_PROFILE: Profile = {
  career: {
    wins: 9,
    draws: 0,
    losses: 3,
    seasons: 2,
    winRate: 75,
    titles: 1,
    best: { placement: 1, of: 8 },
  },
  completed: [
    {
      id: 's1',
      kind: 'hosted',
      teamName: 'Pallet Owls',
      logo: null,
      leagueName: 'Kanto League',
      tournamentName: 'Season One',
      pokemon: [],
      record: { wins: 6, draws: 0, losses: 1 },
      outcome: { placement: 1, of: 8, label: null, champion: true },
      completedAt: '2026-03-04T00:00:00.000Z',
      hosted: {
        leagueSlug: 'kanto',
        tournamentSlug: 'one',
        teamSlug: 'owls',
      },
      external: null,
      archive: null,
    },
  ],
  achievements: [
    { id: 'champ', name: 'Champion', icon: 'trophy', rarity: 'gold', seasons: 1 },
  ],
};

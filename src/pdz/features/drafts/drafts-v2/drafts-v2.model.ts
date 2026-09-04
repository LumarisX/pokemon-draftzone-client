import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';

export type SeasonKind = 'draft' | 'tournament';

export type SeasonStatus = 'active' | 'upcoming' | 'archived';

export type SeasonFilter = 'all' | 'draft' | 'tournament';

export type RosterMon = Pokemon<DraftOptions>;

export type SeasonSource =
  | { type: 'draft'; slug: string }
  | {
      type: 'tournament';
      leagueSlug: string;
      tournamentSlug: string;
      teamId: string;
      teamSlug?: string;
    }
  | { type: 'archive'; archiveId: string; slug?: string };

export type Season = {
  id: string;
  kind: SeasonKind;
  status: SeasonStatus;
  name: string;
  leagueName?: string;
  teamName: string;
  coach?: string;
  logo?: string;
  format: string;
  ruleset: string;
  record: { wins: number; losses: number; diff: number };
  unresolved: number;
  nextMatch?: string | null;
  discord?: string;
  roster: RosterMon[];
  source: SeasonSource;
  homeLink?: string[];
};

export type MatchGame = {
  label: string;
  result: 'win' | 'loss' | 'tie';
  score: [number, number];
  replay?: string;
};

export type SeasonMatch = {
  id: string;
  stage: string;
  teamName: string;
  coach?: string;
  logo?: string;
  scheduledDate?: string | null;
  opponentTimezone?: string | null;
  score: [number, number] | null;
  roster: RosterMon[];
  games: MatchGame[];
  detailLink: string[] | null;
  scoreLink: string[] | null;
  editLink: string[] | null;
  actionParams: { matchup: string } | null;
  manageable: boolean;
};

export type RosterLeader = {
  pokemon: RosterMon;
  brought: number;
  kills: number;
  deaths: number;
  kpg: number;
};

export type SeasonDetail = {
  matches: SeasonMatch[];
  leaders: RosterLeader[];
  hasSchedule: boolean;
  failed: boolean;
};

export function seasonPlayed(season: Season): number {
  return season.record.wins + season.record.losses;
}

export function nextMatch(matches: SeasonMatch[]): SeasonMatch | undefined {
  const now = Date.now();
  return matches
    .filter((match) => !match.score && match.scheduledDate)
    .sort(
      (a, b) =>
        new Date(a.scheduledDate!).getTime() -
        new Date(b.scheduledDate!).getTime(),
    )
    .find((match) => new Date(match.scheduledDate!).getTime() > now);
}

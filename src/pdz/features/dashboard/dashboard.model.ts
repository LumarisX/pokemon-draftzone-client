import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import {
  draftLinks,
  EXTERNAL_DRAFTS_AREA,
} from '@pdz/features/drafts/draft-area';

export type DashboardPhase = 'upcoming' | 'drafting' | 'season' | 'completed';

export type DashboardNext = {
  round: string;
  when: string | null;
  exactTime: boolean;
  matchupSlug: string | null;
  matchupId: string | null;
  opponent: {
    name: string;
    coach: string | null;
    logo: string | null;
    teamSlug: string | null;
  } | null;
};

export type DashboardDraft = {
  picksMade: number;
  rosterSize: number | null;
  onClock: boolean;
  round: number | null;
  pick: number | null;
  deadline: string | null;
};

export type DashboardTeam = {
  id: string;
  kind: 'hosted' | 'external';
  teamName: string;
  logo: string | null;
  leagueName: string;
  tournamentName: string | null;
  format: string | null;
  ruleset: string | null;
  pokemon: Pokemon<DraftOptions>[];
  phase: DashboardPhase;
  record: { wins: number; draws: number; losses: number } | null;
  form: ('win' | 'loss' | 'draw')[];
  standing: { rank: number; of: number } | null;
  next: DashboardNext | null;
  draft: DashboardDraft | null;
  startsAt: string | null;
  hosted: {
    leagueSlug: string;
    tournamentSlug: string;
    teamSlug: string;
    poolSlug: string | null;
  } | null;
  external: { slug: string } | null;
};

export type DashboardUpNext = {
  kind: 'pick' | 'match' | 'draftStart';
  teamId: string;
  when: string | null;
};

export type DashboardOrganizing = {
  tournamentName: string;
  tournamentSlug: string;
  leagueName: string;
  leagueSlug: string;
  logo?: string;
  owner: boolean;
  phase: DashboardPhase;
  startsAt: string | null;
};

export type DashboardLeague = {
  name: string;
  leagueSlug: string;
  logo?: string;
  role: 'owner' | 'admin' | null;
  canCreateTournament: boolean;
};

export type Dashboard = {
  teams: DashboardTeam[];
  upNext: DashboardUpNext[];
  organizing: DashboardOrganizing[];
  leagues: DashboardLeague[];
  completedCount: number;
};

export type TeamLinks = {
  page: unknown[];
  matchup: unknown[] | null;
  draft: unknown[] | null;
};

export const PHASE_LABEL: Record<DashboardPhase, string> = {
  upcoming: 'Upcoming',
  drafting: 'Drafting',
  season: 'In Season',
  completed: 'Completed',
};

export function tournamentLink(leagueSlug: string, tournamentSlug: string) {
  return ['/', LEAGUE_ZONE_PATH, leagueSlug, 'tournaments', tournamentSlug];
}

export function leagueLink(leagueSlug: string) {
  return ['/', LEAGUE_ZONE_PATH, leagueSlug];
}

export function teamLinks(team: DashboardTeam): TeamLinks {
  if (team.hosted) {
    const base = tournamentLink(
      team.hosted.leagueSlug,
      team.hosted.tournamentSlug,
    );
    return {
      page: [...base, 'teams', team.hosted.teamSlug],
      matchup: team.next?.matchupSlug
        ? [...base, 'matchups', team.next.matchupSlug]
        : null,
      draft: team.hosted.poolSlug
        ? [...base, 'pools', team.hosted.poolSlug, 'draft']
        : [...base, 'draft'],
    };
  }
  const links = draftLinks(team.external?.slug ?? '', EXTERNAL_DRAFTS_AREA);
  return {
    page: links.page,
    matchup: team.next?.matchupId ? links.matchup(team.next.matchupId) : null,
    draft: null,
  };
}

export function leagueLine(team: DashboardTeam): string {
  return team.tournamentName
    ? `${team.leagueName} · ${team.tournamentName}`
    : team.leagueName;
}

export function isFuture(value: string | null | undefined): boolean {
  return !!value && new Date(value).getTime() > Date.now();
}

export function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  return `${value}${['th', 'st', 'nd', 'rd'][value % 10] ?? 'th'}`;
}

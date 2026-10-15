import { Pokemon } from '@pdz/core/utils/pokemon';

export type TournamentPhase = 'upcoming' | 'drafting' | 'season' | 'completed';

export type TournamentOutcome = {
  placement: number;
  of: number;
  label: string | null;
  champion: boolean;
};

export type TournamentNextMatch = {
  round: string;
  matchupSlug: string;
  when: string | null;
  exactTime: boolean;
  opponent: {
    name: string;
    coach: string | null;
    logo: string | null;
    teamSlug: string | null;
  } | null;
};

export type TournamentDraftState = {
  status: string;
  picksMade: number;
  rosterSize: number | null;
  onClock: boolean;
  round: number | null;
  pick: number | null;
  deadline: string | null;
};

export type OrganizedTournament = {
  tournamentName: string;
  tournamentSlug: string;
  leagueName: string;
  leagueSlug: string;
  logo?: string;
  owner: boolean;
  phase: TournamentPhase;
  startsAt: string | null;
  completedAt: string | null;
};

export type TournamentDetails = {
  name: string;
  teamName: string;
  tournamentName: string;
  logo?: string;
  discord?: string;
  tournamentSlug: string;
  leagueName: string;
  leagueSlug: string;
  poolSlug?: string;
  teamId: string;
  teamSlug?: string;
  nextMatch?: string | null;
  draft: Pokemon<{ draftFormes?: { id: string; name: string }[] }>[];
  format: string;
  ruleset: string;
  score?: {
    wins: number;
    losses: number;
    diff: number;
  };
  phase?: TournamentPhase;
  completedAt?: string | null;
  completedByOrganizer?: boolean;
  startsAt?: string | null;
  form?: ('win' | 'loss' | 'draw')[];
  next?: TournamentNextMatch | null;
  standing?: { rank: number; of: number } | null;
  draftState?: TournamentDraftState | null;
  outcome?: TournamentOutcome | null;
};

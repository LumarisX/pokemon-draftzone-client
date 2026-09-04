import { Pokemon } from '@pdz/core/utils/pokemon';

export type TournamentDetails = {
  name: string;
  teamName: string;
  tournamentName: string;
  logo?: string;
  discord?: string;
  tournamentSlug: string;
  leagueName: string;
  leagueSlug: string;
  draftSlug?: string;
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
};

import { Pokemon } from '@pdz/core/utils/pokemon';

export type TournamentDetails = {
  name: string;
  teamName: string;
  tournamentName: string;
  logo?: string;
  discord?: string;
  tournamentKey: string;
  leagueName: string;
  leagueKey: string;
  draftKey?: string;
  teamId: string;
  draft: Pokemon<{ draftFormes?: { id: string; name: string }[] }>[];
  format: string;
  ruleset: string;
  score?: {
    wins: number;
    losses: number;
    diff: number;
  };
};

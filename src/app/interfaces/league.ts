import { Pokemon } from './pokemon';

export type TournamentDetails = {
  name: string;
  teamName: string;
  tournamentName: string;
  logo?: string;
  discord: string;
  tournamentKey: string;
  leagueName: string;
  leagueKey: string;
  divisionKey: string;
  draft: Pokemon[];
  format: string;
  ruleset: string;
  score: {
    wins: number;
    loses: number;
    diff: number;
  };
};

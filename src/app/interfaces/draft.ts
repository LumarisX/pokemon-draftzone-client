import { PokemonId } from '../pokemon';

export type Draft = {
  _id: string;
  leagueName: string;
  teamName: string;
  leagueId: string;
  format: number;
  ruleset: number;
  score: {
    wins: number;
    loses: number;
    diff: string;
  };
  owner: string;
  team: Pokemon[];
};

export type Pokemon = {
  id: PokemonId | '';
  shiny?: boolean;
  name: string;
  capt?: {
    tera?: string[];
    z?: boolean;
  };
};

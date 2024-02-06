import { PokemonId } from '../pokemon';

export type Draft = {
  _id: string;
  leagueName: string;
  teamName?: string;
  leagueId: string;
  format: number;
  ruleset: number;
  owner: string;
  team: Pokemon[];
};

export type Pokemon = {
  pid: PokemonId | '';
  shiny?: boolean;
  captain?: boolean;
};

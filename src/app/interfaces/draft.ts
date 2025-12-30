import { PokemonId } from '../data/namedex';

export type Draft = {
  _id: string;
  leagueName: string;
  teamName: string;
  leagueId: string;
  format: string;
  ruleset: string;
  doc: string;
  score: {
    wins: number;
    loses: number;
    diff: string;
  };
  owner: string;
  team: DraftPokemon[];
};

export type DraftPokemon = {
  id: PokemonId | '';
  name: string;
  shiny?: boolean;
  nickname?: string;
  draftFormes?: DraftPokemon[];
  modifiers?: {
    moves?: string[];
    abilities?: string[];
  };
  capt?: {
    tera?: string[];
    z?: string[];
    dmax?: boolean;
  };
};

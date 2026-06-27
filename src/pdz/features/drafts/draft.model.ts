import { PokemonId } from '@pdz/shared/data/namedex';

export type Draft = {
  _id: string;
  leagueName: string;
  teamName: string;
  tournamentId: string;
  format: string;
  ruleset: string;
  doc: string;
  score: {
    wins: number;
    losses: number;
    diff: string;
  };
  owner: string;
  team: DraftPokemon[];
  unresolvedPokemon?: string[];
};

export type DraftPokemon = {
  id: PokemonId | '';
  name: string;
  unresolved?: boolean;
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

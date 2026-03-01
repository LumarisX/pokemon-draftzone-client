import { StatsTable, Type } from '../data';

export type TierPokemonAddon = {
  name: string;
  cost: number;
  capt?: {
    tera?: string[] | true;
    z?: string[];
    dmax?: boolean;
  };
};

export type TierPokemon = {
  name: string;
  id: string;
  types: [Type] | [Type, Type];
  abilities?: string[];
  stats: StatsTable;
  bst: number;
  notes?: string;
  banned?: {
    moves?: string[];
    abilities?: string[];
    tera?: true;
  };
  addons?: TierPokemonAddon[];
};

export type LeagueTier = {
  name: string;
  cost?: number;
  pokemon: TierPokemon[];
};

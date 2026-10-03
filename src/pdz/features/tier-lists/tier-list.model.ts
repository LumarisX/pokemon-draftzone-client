import { StatsTable, Type } from '@pdz/shared/data';

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
  draftBanned?: boolean;
  banned?: {
    moves?: string[];
    abilities?: string[];
    tera?: true;
  };
  addons?: TierPokemonAddon[];
  formes?: { id: string; name: string }[];
  draftFormes?: { id: string; name: string }[];
};

export type LeagueTier = {
  id?: string;
  name: string;
  cost?: number;
  pokemon: TierPokemon[];
};

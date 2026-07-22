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
  /** Alternate formes this entry is allowed to run. */
  formes?: { id: string; name: string }[];
  /** Populated from `formes` for the sprite's forme stack; not persisted. */
  draftFormes?: { id: string; name: string }[];
};

export type LeagueTier = {
  name: string;
  cost?: number;
  required?: number;
  pokemon: TierPokemon[];
};

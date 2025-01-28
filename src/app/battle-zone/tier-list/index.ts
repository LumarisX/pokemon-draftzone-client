import { StatsTable, Type } from '../../data';

export type TierSubPokemon = {
  name: string;
  id: string;
  types: [Type] | [Type, Type];
  stats: StatsTable;
  bst: number;
  banned?: {
    moves: string[];
    abilities: string[];
  };
};

export type TierPokemon = TierSubPokemon & {
  subPokemon?: TierSubPokemon[];
  drafted: boolean;
};

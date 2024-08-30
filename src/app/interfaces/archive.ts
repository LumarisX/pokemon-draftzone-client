import { PokemonId } from '../data/namedex';

export type Archive = {
  _id: string;
  leagueName: string;

  teamName: string;
  format: number;
  ruleset: number;
  score: {
    wins: number;
    loses: number;
    diff: string;
  };
  owner: string;
  team: { id: PokemonId; name: string }[];
};

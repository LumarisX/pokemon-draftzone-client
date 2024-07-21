import { PokemonId } from '../pokemon';

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
  team: { pid: PokemonId; name: string }[];
};

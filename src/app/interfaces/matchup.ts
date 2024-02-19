import { PokemonId } from '../pokemon';
import { Pokemon } from './draft';

export type Matchup = {
  _id: string;
  aTeam: Side;
  bTeam: Side;
  score: number[];
  stage: string;
  replay: String[];
};

type Side = {
  _id?: string;
  teamName: string;
  team: Pokemon[];
  name?: string;
  stats: {
    pid: PokemonId;
    kills?: number;
    deaths?: number;
  }[];
  paste?: String;
};

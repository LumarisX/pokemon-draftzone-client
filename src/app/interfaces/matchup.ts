import { PokemonId } from '../pokemon';
import { Pokemon } from './draft';

export type Matchup = {
  _id: string;
  aTeam: Side;
  bTeam: Side;
  stage: string;
  replay?: String;
};

export type Side = {
  _id?: string;
  teamName: string;
  team: Pokemon[];
  name?: string;
  stats: [
    string & PropertyKey,
    {
      kills?: number;
      deaths?: number;
      indirect?: number;
      brought: number;
    } & any
  ];
  score: number;
  paste?: String;
};

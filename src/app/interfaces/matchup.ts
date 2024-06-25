import { PokemonId } from '../pokemon';
import { Pokemon } from './draft';

export type Matchup = {
  _id: string;
  aTeam: Side;
  bTeam: Side;
  stage: string;
  matches: Match[];
};
export type Match = {
  aTeam: {
    stats: [
      string & PropertyKey,
      {
        kills?: number;
        deaths?: number;
        indirect?: number;
        brought: number;
      } & any
    ];
  };
  bTeam: {
    stats: [
      string & PropertyKey,
      {
        kills?: number;
        deaths?: number;
        indirect?: number;
        brought: number;
      } & any
    ];
  };
  replay?: String;
  winner: '' | 'a' | 'b';
};

export type Side = {
  _id?: string;
  teamName: string;
  team: Pokemon[];
  name?: string;
  paste?: String;
};

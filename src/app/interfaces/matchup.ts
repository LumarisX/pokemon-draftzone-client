import { Pokemon } from './draft';

export type Matchup = {
  _id: string;
  name: string;
  aTeam: Side;
  bTeam: Side;
  stage: string;
  matches: Match[];
  score: [number, number] | null;
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
      } & any,
    ];
    score: number;
  };
  bTeam: {
    stats: [
      string & PropertyKey,
      {
        kills?: number;
        deaths?: number;
        indirect?: number;
        brought: number;
      } & any,
    ];
    score: number;
  };
  replay?: String;
  winner?: null | 'a' | 'b';
};

export type Side = {
  _id?: string;
  teamName: string;
  team: Pokemon[];
  name?: string;
  paste?: String;
};

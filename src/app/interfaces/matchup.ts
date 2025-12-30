import { DraftPokemon } from './draft';

export type Matchup = {
  _id: string;
  leagueName: string;
  aTeam: Side;
  bTeam: Side;
  stage: string;
  matches: Match[];
  score: [number, number] | null;
};

export type Side = {
  _id?: string;
  teamName: string;
  team: DraftPokemon[];
  coach?: string;
  paste?: String;
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
  replay?: string;
  winner?: null | 'a' | 'b';
};

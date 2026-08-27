import { DraftPokemon } from '../draft.model';

export type MatchSide = 'a' | 'b';

export type ForfeitSide = MatchSide | 'both';

export type Matchup = {
  _id: string;
  leagueName: string;
  aTeam: Side;
  bTeam: Side;
  stage: string;
  matches: Match[];
  score: [number, number] | null;
  winner?: MatchSide | null;
  scoreOverride?: [number, number] | null;
  winnerOverride?: MatchSide | null;
  forfeitedBy?: ForfeitSide | null;
};

export type Side = {
  _id?: string;
  teamName: string;
  team: DraftPokemon[];
  coach?: string;
  paste?: string;
};

export type MatchPokemonStat = {
  kills?: number;
  indirect?: number;
  teammate?: number;
  deaths?: number;
  brought?: number;
  status?: 'brought' | 'survived' | 'fainted';
};

export type MatchStatTuple = [string, MatchPokemonStat];

export type MatchTeam = {
  stats: MatchStatTuple[];
  score: number;
};

export type Match = {
  aTeam: MatchTeam;
  bTeam: MatchTeam;
  replay?: string;
  winner?: MatchSide | null;
};

export type ScorePatch = {
  aTeamPaste: string;
  bTeamPaste: string;
  matches: {
    aTeam: MatchTeam;
    bTeam: MatchTeam;
    replay?: string;
    winner?: MatchSide;
  }[];
  scoreOverride: [number, number] | null;
  winnerOverride: MatchSide | null;
  forfeitedBy: ForfeitSide | null;
};

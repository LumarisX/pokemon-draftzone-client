import { PokemonId } from '../pokemon';

export type Matchup = {
  _id: string;
  aTeam: Side;
  bTeam: Side;
  score: number[];
  stage: string;
};

type Side = {
  _id?: string;
  teamName: string;
  team: Team[];
  name?: string;
};

type Team = {
  pid: PokemonId;
};

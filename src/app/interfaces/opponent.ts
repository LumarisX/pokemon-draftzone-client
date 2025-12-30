import { DraftPokemon } from './draft';
import { Match } from './matchup';

export type Opponent = {
  _id: string;
  teamName: string;
  ruleset: string;
  coach?: string;
  stage: string;
  team: DraftPokemon[];
  matches: Match[];
  score: [number, number] | null;
};

import { Pokemon } from './draft';
import { Match } from './matchup';

export type Opponent = {
  _id: string;
  teamName: string;
  ruleset: string;
  coach?: string;
  stage: string;
  team: Pokemon[];
  matches: Match[];
  score: [number, number] | null;
};

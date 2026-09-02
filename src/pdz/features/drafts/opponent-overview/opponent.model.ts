import { DraftPokemon } from '../draft.model';
import { Match } from '../matchup-overview/matchup.model';

export type Opponent = {
  _id: string;
  teamName: string;
  ruleset: string;
  coach?: string;
  stage: string;
  team: DraftPokemon[];
  matches: Match[];
  score: [number, number] | null;
  scheduledDate?: string | null;
  opponentTimezone?: string | null;
};

export type MatchSchedule = {
  scheduledDate: string | null;
  opponentTimezone?: string;
};

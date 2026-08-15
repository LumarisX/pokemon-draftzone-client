import { PokemonId } from '@pdz/shared/data/namedex';
import { League } from '../league.interface';

export type MatchupSideKey = 'side1' | 'side2';

export type MatchupOutcome =
  | MatchupSideKey
  | 'draw'
  | 'side1ffw'
  | 'side2ffw'
  | 'dffl';

export type MatchupSideDetail = {
  id: string;
  /** URL identifier for the team's page. */
  slug: string;
  name: string;
  coach: string;
  logo?: string;
  score: number;
  draft: { id: PokemonId; capt?: { tera?: boolean } }[];
  coachId: string;
  timezone?: string;
  discordName?: string;
};

export type MatchupGame = {
  link?: string;
  team1: { team: League.MatchTeamStats; score: number; winner: boolean };
  team2: { team: League.MatchTeamStats; score: number; winner: boolean };
};

export type MatchupViewer = {
  side: MatchupSideKey | null;
  isOrganizer: boolean;
  chatEnabled: boolean;
  coachReportingEnabled: boolean;
  canChat: boolean;
  canReport: boolean;
  canReview: boolean;
};

export type MatchupReport = {
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  teamId?: string;
  score: { team1: number; team2: number };
  winner?: MatchupSideKey | 'draw';
  forfeit?: boolean;
  notes?: string;
  matches: MatchupGame[];
};

export type MatchupDetail = {
  /** The matchup's ObjectId — what the chat room keys its `target` on. */
  id: string;
  /** URL identifier for this page. */
  slug: string;
  team1: MatchupSideDetail;
  team2: MatchupSideDetail;
  matches: MatchupGame[];
  score: { team1: number; team2: number };
  winner?: MatchupOutcome;
  forfeit: boolean;
  status?: 'pending' | 'approved';
  label?: string;
  notes?: string;
  scheduledDate?: string;
  stage: { id: string; slug: string; name: string };
  round: { name: string; matchDeadline?: string; bestOf?: number } | null;
  viewer: MatchupViewer;
  report?: MatchupReport;
};

export type MatchupReportPayload = {
  score?: { team1: number; team2: number };
  winner?: MatchupSideKey | 'draw';
  forfeit?: boolean;
  notes?: string;
  matches: {
    link?: string;
    winner: MatchupSideKey | 'draw';
    team1: { score: number; pokemon: Record<string, League.MatchPokemonStats> };
    team2: { score: number; pokemon: Record<string, League.MatchPokemonStats> };
  }[];
};

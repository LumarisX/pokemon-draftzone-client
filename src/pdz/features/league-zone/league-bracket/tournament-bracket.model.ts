export interface TournamentBracketRound {
  _id: string;
  name: string;
  matchDeadline?: string | null;
  tradeDeadline?: string | null;
}

export interface TournamentBracketSeedingGroup {
  method: 'certified-random' | 'manual';
  label: string | null;
  seedFrom: number | null;
  seedTo: number | null;
  inputTeamsHash: string | null;
  algorithmVersion: string | null;
}

export interface TournamentBracketSeeding {
  method: 'certified-random' | 'manual' | 'mixed';
  seededAt: string;
  inputTeamsHash: string | null;
  algorithmVersion: string | null;
  timesSeeded: number;
  groups: TournamentBracketSeedingGroup[];
}

export interface TournamentBracketTeam {
  seed: number;
  teamId: string;
  teamSlug: string;
  teamName: string;
  coachName: string;
  logo?: string;
}

export interface TournamentBracketStage {
  _id: string;
  slug: string;
  name: string;
  type: string;
  order: number;
  public: boolean;
  seeding: TournamentBracketSeeding | null;
  teams: TournamentBracketTeam[];
}

export interface TournamentBracketMatch {
  _id: string;
  slug: string;
  stage: string | null;
  round: string | null;
  position: number | null;
  label: string | null;
  a: { type: string; seed?: number; from?: string } | null;
  b: { type: string; seed?: number; from?: string } | null;
  winner?: 0 | 1;
  forfeit?: boolean;
  advances?: 'side1' | 'side2' | 'none' | null;
  score?: [number, number];
  scheduledDate?: string | null;
  replay?: string;
  replays?: string[];
}

export interface TournamentBracket {
  rounds: TournamentBracketRound[];
  currentRoundIndex: number;
  stages: TournamentBracketStage[];
  matches: TournamentBracketMatch[];
}

export interface UpdateTournamentBracketPayload {
  rounds: {
    _id?: string;
    name: string;
    matchDeadline?: string | null;
    tradeDeadline?: string | null;
  }[];
  stages: {
    _id?: string;
    key: string;
    name: string;
    type: string;
    public?: boolean;
    seedGroups?: {
      teamIds: string[];
      method: 'certified-random' | 'manual';
      label?: string;
    }[];
  }[];
  matches: {
    _id?: string;
    key: string;
    stageKey: string;
    roundIndex: number;
    position?: number;
    label?: string;
    a: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
    b: { type: 'seed' | 'winner' | 'loser'; seed?: number; from?: string };
  }[];
  currentRoundIndex?: number;
}

export interface UpdateTournamentBracketResult {
  message: string;
  stageIds: Record<string, string>;
  matchIds: Record<string, string>;
}

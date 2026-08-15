// ─── Tournament bracket wire model ───────────────────────────────────────────
//
// Mirrors GET/PATCH /leagues/:leagueSlug/tournaments/:tournamentSlug/bracket.
//
// Rounds belong to the tournament and every stage is laid out against them, so
// the three lists are read and written as one unit — editing rounds from a
// single stage would renumber every other stage's and orphan their matchups.

export interface TournamentBracketRound {
  _id: string;
  name: string;
  matchDeadline?: string | null;
  tradeDeadline?: string | null;
  bestOf?: number | null;
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
  /** Position in this stage's own seed order, 1-based. */
  seed: number;
  teamId: string;
  /** URL identifier for the team's page. */
  teamSlug: string;
  teamName: string;
  coachName: string;
  logo?: string;
}

export interface TournamentBracketStage {
  _id: string;
  /** URL identifier for the stage's pages and endpoints. */
  slug: string;
  name: string;
  type: string;
  order: number;
  public: boolean;
  seeding: TournamentBracketSeeding | null;
  /** In seed order — seed N is `teams[N - 1]`, numbered within this stage. */
  teams: TournamentBracketTeam[];
}

export interface TournamentBracketMatch {
  /** Slots reference their upstream match by this, so it stays the ObjectId. */
  _id: string;
  /** URL identifier for the matchup page. */
  slug: string;
  /** Owning stage's `_id`. */
  stage: string | null;
  /** Round subdocument `_id` on the tournament. */
  round: string | null;
  position: number | null;
  label: string | null;
  a: { type: string; seed?: number; from?: string } | null;
  b: { type: string; seed?: number; from?: string } | null;
  winner?: 0 | 1;
  /** A forfeit: the score below is the configured game difference, not a result. */
  forfeit?: boolean;
  /** Games won, `[side1, side2]`. */
  score?: [number, number];
  scheduledDate?: string | null;
  /** Game 1's replay. Superseded by `replays`; kept for older callers. */
  replay?: string;
  /** Every recorded game's replay link, in game order. */
  replays?: string[];
}

export interface TournamentBracket {
  rounds: TournamentBracketRound[];
  currentRoundIndex: number;
  stages: TournamentBracketStage[];
  matches: TournamentBracketMatch[];
}

// ─── Save payload ────────────────────────────────────────────────────────────

export interface UpdateTournamentBracketPayload {
  rounds: {
    _id?: string;
    name: string;
    matchDeadline?: string | null;
    tradeDeadline?: string | null;
    bestOf?: number;
  }[];
  stages: {
    _id?: string;
    /** Local handle the matches reference; a stage's `_id` once it has one. */
    key: string;
    name: string;
    type: string;
    public?: boolean;
    /**
     * Only sent for a stage whose draw has not happened. A stage that has been
     * seeded may append teams but never re-draw, so resending its groups could
     * only be a no-op or a rejection.
     */
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
  /** Payload stage key → server stage id, for stages created by the save. */
  stageIds: Record<string, string>;
  /** Payload match key → server matchup id. */
  matchIds: Record<string, string>;
}

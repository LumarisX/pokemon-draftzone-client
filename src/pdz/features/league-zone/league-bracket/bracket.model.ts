// ─── Bracket Data Model ───────────────────────────────────────────────────────
// Shared between the bracket renderer, the generator/mutation helpers
// (bracket-generator.ts), the league-zone services, and the manage editor.

export type BracketSlotFlex =
  | { type: 'seed'; seed: number }
  | { type: 'winner'; from: string }
  | { type: 'loser'; from: string }
  | { type: 'bye'; seed: number }
  | { type: 'empty' };

export interface BracketTeamFlex {
  teamName: string;
  coachName: string;
  seed: number;
  logo?: string;
  teamId?: string;
  /** URL identifier for the team's page. Absent on a locally-built bracket. */
  teamSlug?: string;
}

/**
 * One row of the stage's global round axis. Rounds are stage-level: every
 * section that has matches in round `i` shares that round's name and deadlines,
 * because a round is a slice of the schedule, not a column of one bracket.
 */
export interface BracketRoundMeta {
  /** Server subdocument id (`StageEntity.rounds[]._id`). Absent until saved. */
  id?: string;
  name: string;
  matchDeadline?: string | null;
  tradeDeadline?: string | null;
  bestOf?: number | null;
}

export interface FlexBracketMatch {
  /** Local identity; slots wire to each other by it. */
  id: string;
  /**
   * URL identifier for the matchup page. Absent for a match that only exists
   * in the builder — it has no page until it has been saved.
   */
  slug?: string;
  /**
   * Index into the stage's global round list — the same axis for every section,
   * so a section that starts later simply has no matches in the earlier rounds.
   * (This was once numbered independently per section; `assignGlobalRounds`
   * derives the global value from the wiring for freshly generated blocks.)
   */
  round: number;
  /** Index within the (section, round) cell. Determines left-to-right ordering. */
  position: number;
  /** Groups matches into visual sections (e.g. 'winners', 'losers', 'finals'). Defaults to 'main'. */
  section?: string;
  a: BracketSlotFlex;
  b: BracketSlotFlex;
  winner?: 0 | 1;
  replay?: string;
  /** Every recorded game's replay link, in game order. */
  replays?: string[];
  /** Games won, `[side1, side2]`. Only meaningful once a winner is set. */
  score?: [number, number];
  /** A forfeit — the score is the configured game difference, not a result. */
  forfeit?: boolean;
  /** Override the auto-generated match label. */
  label?: string;
}

/**
 * What a section is structurally, independent of its key. A bracket may hold
 * several independently-configured blocks, so keys get prefixed to stay unique
 * (`playoffs-winners`, `wildcard-winners`, …) — `kind` is what auto titles and
 * the server's round naming key off, so those keep working after prefixing.
 */
export type BracketSectionKind =
  | 'main'
  | 'winners'
  | 'losers'
  | 'finals'
  | 'round-robin';

export interface FlexBracketSectionConfig {
  key: string;
  /** Display title above the section. Omit or leave empty to hide. */
  title?: string;
  /** Structural role. Falls back to `key` when absent (pre-prefix brackets). */
  kind?: BracketSectionKind;
  /**
   * Name of the configured block this section came from. Disambiguates round
   * names in the stage's flat round list, where several blocks would otherwise
   * each contribute a "Round 1".
   */
  label?: string;
  /**
   * Teams entering this section, used for "Round of N" titles. Seed numbers
   * are global to the bracket, so they can't be counted per section.
   */
  teamCount?: number;
  /** Controls vertical ordering of sections. Lower = higher. */
  order?: number;
  /** Per-round title overrides keyed by global round number. */
  roundTitles?: Record<number, string>;
}

export interface FlexBracketData {
  format?: 'single-elim' | 'double-elim' | 'custom';
  teams: BracketTeamFlex[];
  matches: FlexBracketMatch[];
  sections?: FlexBracketSectionConfig[];
}

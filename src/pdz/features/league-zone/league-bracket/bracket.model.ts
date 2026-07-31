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
}

export interface FlexBracketMatch {
  id: string;
  /** Column index (left = earlier rounds). Within a section, rounds are numbered independently. */
  round: number;
  /** Row index within the round. 0-indexed, used to determine vertical ordering of leaf matches. */
  position: number;
  /** Groups matches into visual sections (e.g. 'winners', 'losers', 'finals'). Defaults to 'main'. */
  section?: string;
  a: BracketSlotFlex;
  b: BracketSlotFlex;
  winner?: 0 | 1;
  replay?: string;
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
  /** Per-round title overrides keyed by round number. */
  roundTitles?: Record<number, string>;
}

export interface FlexBracketData {
  format?: 'single-elim' | 'double-elim' | 'custom';
  teams: BracketTeamFlex[];
  matches: FlexBracketMatch[];
  sections?: FlexBracketSectionConfig[];
}

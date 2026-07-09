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

export interface FlexBracketSectionConfig {
  key: string;
  /** Display title above the section. Omit or leave empty to hide. */
  title?: string;
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

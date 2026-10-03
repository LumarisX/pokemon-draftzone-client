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
  teamSlug?: string;
}

export interface BracketRoundMeta {
  id?: string;
  name: string;
  matchDeadline?: string | null;
  tradeDeadline?: string | null;
}

export interface FlexBracketMatch {
  id: string;
  slug?: string;
  round: number;
  position: number;
  section?: string;
  a: BracketSlotFlex;
  b: BracketSlotFlex;
  winner?: 0 | 1;
  replay?: string;
  replays?: string[];
  score?: [number, number];
  forfeit?: boolean;
  advances?: 'side1' | 'side2' | 'none' | null;
  label?: string;
}

export type BracketSectionKind =
  | 'main'
  | 'winners'
  | 'losers'
  | 'finals'
  | 'round-robin';

export interface FlexBracketSectionConfig {
  key: string;
  title?: string;
  kind?: BracketSectionKind;
  label?: string;
  teamCount?: number;
  order?: number;
  roundTitles?: Record<number, string>;
}

export interface FlexBracketData {
  format?: 'single-elim' | 'double-elim' | 'custom';
  teams: BracketTeamFlex[];
  matches: FlexBracketMatch[];
  sections?: FlexBracketSectionConfig[];
}

export type BracketSlotFlex =
  | { type: 'seed'; seed: number }
  | { type: 'winner'; from: string }
  | { type: 'loser'; from: string }
  | { type: 'bye'; seed: number }
  | { type: 'empty' };

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
  scheduledDate?: string | null;
}

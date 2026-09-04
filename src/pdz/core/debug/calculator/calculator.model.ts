export interface CalcSideInput {
  species: string;
  level?: number;
  ability?: string;
  item?: string;
  nature?: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  boosts?: Record<string, number>;
  status?: string;
  hp?: number;
  teraType?: string;
  terastallized?: boolean;
}

export type ForcedOutcome = 'roll' | 'always' | 'never';

export interface CalcRequest {
  ruleset?: string;
  attacker: CalcSideInput;
  defender: CalcSideInput;
  move: string;
  field?: { weather?: string; terrain?: string };
  turns?: number;
  overrides?: { hit?: ForcedOutcome; crit?: ForcedOutcome };
}

export interface CalcBranches {
  accuracy: { lands: boolean; weight: number }[];
  crit: { crit: boolean; weight: number }[];
  hits: { hits: number; weight: number }[];
  secondaries: { effects: string[]; weight: number }[];
}

export interface CalcOutcome {
  probability: number;
  damage: number;
  hp: number;
  hpPercent: number;
  fainted: boolean;
  status?: string;
  boosts?: Record<string, number>;
  attackerBoosts?: Record<string, number>;
}

export interface CalcResponse {
  supported: boolean;
  reasons?: string[];
  input?: unknown;
  branches?: CalcBranches;
  damage?: {
    min: number;
    max: number;
    expected: number;
    minPercent: number;
    maxPercent: number;
    rolls: { damage: number; percent: number; probability: number }[];
  };
  outcomes?: CalcOutcome[];
  ko?: {
    chances: number[];
    exactlyOnTurn: number[];
    guaranteedTurn?: number;
    earliestTurn?: number;
    likeliestTurn?: number;
    unresolved: number;
    summary: string;
  };
  meta?: {
    distinctOutcomes: number;
    totalWeight: number;
    prunedMass: number;
    elapsedMs: number;
  };
}

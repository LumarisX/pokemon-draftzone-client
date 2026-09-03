import type { TeamContextType } from './data/teambuilder.models';

export interface RosterEntry {
  readonly id: string;
  readonly name: string;
  readonly shiny?: boolean;
  readonly nickname?: string;
}

export interface OpponentSpeedTier {
  readonly speed: number;
  readonly modifiers: string[];
}

export interface OpponentPokemon {
  readonly id: string;
  readonly name: string;
  readonly shiny?: boolean;
  readonly weak?: Record<string, number>;
  readonly tiers?: readonly OpponentSpeedTier[];
}

export interface TeambuilderContext {
  readonly type: TeamContextType;
  readonly id: string;
  readonly ruleset: string;
  readonly level: number;
  readonly roster: readonly RosterEntry[];
  readonly opponent?: readonly OpponentPokemon[];
  readonly speedModifiers?: readonly string[];
}

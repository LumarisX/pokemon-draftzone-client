import type {
  LegalityIssue,
  PokemonSet,
  StatsTable,
  StatSystemId,
} from '@pdz/sets';

export interface TeambuilderItem {
  readonly id: string;
  readonly pngId: string;
  readonly name: string;
  readonly desc: string;
  readonly tags: string[];
}

export interface StatRules {
  readonly id: StatSystemId;
  readonly label: string;
  readonly pointLabel: string;
  readonly field: 'evs' | 'sps';
  readonly perStatMax: number;
  readonly total: number;
  readonly usableTotal: number;
  readonly granularity: number;
  readonly usesIvs: boolean;
}

export interface SpeciesBuildData {
  readonly id: string;
  readonly name: string;
  readonly abilities: string[];
  readonly items: TeambuilderItem[];
  readonly item?: string;
  readonly teraType?: string;
  readonly types: [string] | [string, string];
  readonly baseStats: StatsTable;
  readonly genders: ('M' | 'F')[];
  readonly statSystem: StatSystemId;
  readonly statRules: StatRules;
}

export interface LearnsetMove {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly category: 'Physical' | 'Special' | 'Status';
  readonly basePower: number;
  readonly accuracy: number | true;
  readonly pp: number;
  readonly desc: string;
  readonly tags: string[];
  readonly isStab: boolean;
  readonly strength: number;
}

export type TeamContextType = 'matchup' | 'standalone';

export interface TeamContext {
  readonly type: TeamContextType;
  readonly id: string;
}

export interface SetIssues {
  readonly index: number;
  readonly issues: LegalityIssue[];
}

export interface Team {
  readonly slug: string;
  readonly name: string;
  readonly ruleset: string;
  readonly level: number;
  readonly context: TeamContext;
  readonly sets: PokemonSet[];
  readonly issues: SetIssues[];
}

export interface SaveTeamPayload {
  readonly context: TeamContext;
  readonly name: string;
  readonly ruleset: string;
  readonly level: number;
  readonly sets: PokemonSet[];
}

export interface LearnsetQuery {
  readonly id: string;
  readonly ruleset: string;
  readonly types: readonly string[];
  readonly ability?: string;
  readonly teraType?: string;
}

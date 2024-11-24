import { ExtendedType, StatsTable, Type } from '../data';
import { Pokemon } from '../interfaces/draft';

export type Speedtier = {
  pokemon: Pokemon;
  speed: number;
  modifiers: string[];
  team: number;
  stick?: boolean;
};

export type SpeedChart = {
  tiers: Speedtier[];
  modifiers: string[];
  level: number;
};

export type Summary = {
  team: (Pokemon & {
    abilities: string[];
    types: string[];
    baseStats: StatsTable;
  })[];
  teamName: String;
  stats: {
    mean: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
    };
    median: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
    };
    max: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
    };
  };
};

export type TypeChart = {
  team: (Pokemon & {
    weak: {
      [key in ExtendedType]: number;
    };
    types: string[];
    disabled?: Boolean;
  })[];
};

export type MoveChart = MoveCategory[];

export type MoveCategory = {
  categoryName: string;
  moves: { name: string; type: string; pokemon: Pokemon[] }[];
};

export type CoverageChart = Pokemon & {
  coverage: {
    physical: [
      {
        name: string;
        stab: boolean;
        type: Type;
        recommended?: boolean;
      }
    ];
    special: [
      {
        name: string;
        stab: boolean;
        type: Type;
        recommended?: boolean;
      }
    ];
  };
};

export type MatchupData = {
  format: string;
  ruleset: string;
  level: number;
  leagueName: string;
  stage: string;
  gameTime: string;
  speedchart: SpeedChart;
  summary: Summary[];
  overview: Summary[];
  typechart: TypeChart[];
  movechart: MoveChart[];
  coveragechart: CoverageChart[][];
};

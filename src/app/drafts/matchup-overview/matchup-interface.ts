import { ExtendedType, StatsTable, Type } from '../../data';
import { PokemonId } from '../../data/namedex';
import { Pokemon } from '../../interfaces/draft';

export type Speedtier = {
  pokemon: Pokemon;
  speed: number;
  modifiers: string[];
  team: number;
  stick?: boolean;
};

export type SpeedChart = {
  teams: (Pokemon & {
    spe: number;
    tiers: {
      modifiers: string[];
      speed: number;
    }[];
  })[][];
  level: number;
  modifiers: string[];
};

export type Summary = {
  team: (Pokemon & {
    abilities: string[];
    index: number;
    types: string[];
    bst: number;
    cst: number;
    baseStats: StatsTable;
  })[];
  teamName: String;
  coach?: string;
  stats: {
    mean: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
      bst?: number;
      cst?: number;
    };
    median: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
      bst?: number;
      cst?: number;
    };
    max: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
      bst?: number;
      cst?: number;
    };
  };
};

export type TypeChartPokemon = Pokemon & {
  weak: [
    {
      [key in ExtendedType]: number;
    },
    {
      [key in ExtendedType]: number;
    },
  ];

  types: string[];
  disabled?: boolean;
};

export type TypeChart = {
  team: TypeChartPokemon[];
};

export type MoveChart = MoveCategory[];

export type CoverageMove = {
  id: string;
  name: string;
  ePower: number;
  cPower: number;
  type: Type;
  category: 'Physical' | 'Special';
  stab?: true;
};

export type FullCoverageMove = {
  id: string;
  name: string;
  type: string;
  category: string;
  accuracy: string;
  basePower: string;
  desc: string;
  pp: number;
  value: number;
};

export type CoveragePokemon = {
  id: PokemonId;
  coverage: {
    physical: CoverageMove[];
    special: CoverageMove[];
  };
  fullcoverage: {
    physical: {
      [key: string]: FullCoverageMove[];
    };
    special: {
      [key: string]: FullCoverageMove[];
    };
  };
};

export type CoverageMax = {
  type: Type;
  category: 'physical' | 'special';
  value: number;
}[];

export type Coverage = {
  team: CoveragePokemon[];
  max: CoverageMax;
};

export type MoveCategory = {
  categoryName: string;
  show?: boolean;
  moves: { name: string; type: string; pokemon: Pokemon[]; desc: string }[];
};

export type CoverageChart = Pokemon & {
  coverage: {
    physical: [
      {
        name: string;
        stab: boolean;
        type: Type;
        recommended?: boolean;
        selected?: boolean;
      },
    ];
    special: [
      {
        name: string;
        stab: boolean;
        type: Type;
        recommended?: boolean;
        selected?: boolean;
      },
    ];
  };
};

export type MatchupData = {
  speedchart: SpeedChart;
  summary: Summary[];
  typechart: TypeChart[];
  movechart: MoveChart[];
  coveragechart: CoverageChart[][];
  details: {
    leagueName: string;
    stage: string;
    gameTime: string;
    format: string;
    ruleset: string;
    level: number;
  };
};

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
  tiers: Speedtier[];
  modifiers: string[];
  level: number;
};

export type Summary = {
  team: (Pokemon & {
    abilities: string[];
    index: number;
    types: string[];
    bst: number;
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
      bst?: number;
    };
    median: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
      bst?: number;
    };
    max: {
      hp?: number;
      atk?: number;
      def?: number;
      spa?: number;
      spd?: number;
      spe?: number;
      bst?: number;
    };
  };
};

export type TypeChart = {
  team: (Pokemon & {
    weak: [
      {
        [key in ExtendedType]: number;
      },
      {
        [key in ExtendedType]: number;
      },
    ];

    types: string[];
    disabled?: Boolean;
  })[];
};

export type MoveChart = MoveCategory[];

type CoverageMove = {
  id: string;
  name: string;
  ePower: number;
  cPower: number;
  type: Type;
  category: 'Physical' | 'Special';
  stab?: true;
};

export type Coverage = {
  team: {
    id: PokemonId;
    coverage: {
      physical: CoverageMove[];
      special: CoverageMove[];
    };
  }[];
  max: {
    physical: { [key: string]: CoverageMove | undefined };
    special: { [key: string]: CoverageMove | undefined };
  };
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

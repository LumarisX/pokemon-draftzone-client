import { ExtendedType, StatsTable, Type } from '@pdz/shared/data';
import { PokemonId } from '@pdz/shared/data/namedex';
import { DraftPokemon } from '../draft.model';
import { Pokemon } from '@pdz/core/utils/pokemon';
import { PokemonData } from './widgets/teambuilder/pokemon-builder/pokemon-builder.model';

export type Speedtier = {
  pokemon: DraftPokemon;
  speed: number;
  modifiers: string[];
  team: number;
  stick?: boolean;
};

export type SpeedChart = {
  teams: (DraftPokemon & {
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
  team: (DraftPokemon & {
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

export type TypeChartPokemon = DraftPokemon & {
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

export type MoveChart = {
  moves: {
    name: string;
    type: Type;
    desc: string;
    accuracy: string;
    basePower: string;
    ePower: number;
    category: 'Physical' | 'Special' | 'Status';
    tags: string[];
    pokemon: string[];
  }[];
  tags: string[];
  pokemon: Pokemon[];
};

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

export type CoverageChart = DraftPokemon & {
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
  notes?: string;
};

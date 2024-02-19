import { Pokemon } from '../interfaces/draft';
import { BattlePokedex } from '../pokedex';
import { PokemonId } from '../pokemon';

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
};

export type Summery = {
  team: [
    Pokemon & {
      name: string;
      abilities: string[];
      types: string[];
      baseStats: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
      };
    }
  ];
  teamName: String;
  stats: {
    mean: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
    };
    median: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
    };
    max: {
      hp: number;
      atk: number;
      def: number;
      spa: number;
      spd: number;
      spe: number;
    };
  };
};

export type TypeChart = {
  team: (Pokemon & {
    weak: Types;
    disabled?: Boolean;
  })[];
};

export type Types = {
  Bug: number;
  Dark: number;
  Dragon: number;
  Electric: number;
  Fairy: number;
  Fighting: number;
  Fire: number;
  Flying: number;
  Ghost: number;
  Grass: number;
  Ground: number;
  Ice: number;
  Normal: number;
  Poison: number;
  Psychic: number;
  Rock: number;
  Steel: number;
  Stellar: number;
  Water: number;
  brn: number;
  par: number;
  prankster: number;
  tox: number;
  psn: number;
  frz: number;
  slp: number;
  powder: number;
  sandstorm: number;
  hail: number;
  trapped: number;
};

export type MoveChart = MoveCategory[];

export type MoveCategory = {
  catName: string;
  moves: [
    {
      moveName: string;
      pokemon: [keyof typeof BattlePokedex];
    }
  ];
};

export type CoverageChart = {
  pid: PokemonId;
  coverage: {
    physical: [
      {
        name: string;
        stab: boolean;
        type: keyof Types;
        recommended?: boolean;
      }
    ];
    special: [
      {
        name: string;
        stab: boolean;
        type: keyof Types;
        recommended?: boolean;
      }
    ];
  };
};

import { PokemonId } from '../../../assets/data/namedex';

export type ReplayData = {
  gametype: string;
  genNum: number;
  turns: number;
  gameTime: number;
  stats: ReplayPlayer[];
  events: { player: number; turn: number; message: string }[];
};

export type ReplayPlayer = {
  username: undefined | string;
  total: {
    kills: number;
    deaths: number;
    damageDealt: number;
    damageTaken: number;
  };
  turnChart: { turn: number; damage: number; remaining: number }[];
  team: ReplayMon[];
  win: boolean;
  luck: {
    moves: {
      total: number;
      hits: number;
      expected: number;
      actual: number;
    };
    crits: {
      total: number;
      hits: number;
      expected: number;
      actual: number;
    };
    status: {
      total: number;
      full: number;
      expected: number;
      actual: number;
    };
  };
};

export type ReplayMon = {
  formes: { detail: string; id: PokemonId }[];
  kills: [number, number];
  damageDealt: [number, number];
  damageTaken: [number, number];
  hpRestored: number;
  fainted: boolean;
  brought: boolean;
};

import { PokemonId } from '../../pokemon';

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
  accuracy: {
    total: number;
    hits: number;
    expected: number;
    actual: number;
    luck: number;
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

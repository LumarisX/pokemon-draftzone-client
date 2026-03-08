import { PokemonId } from '../../data/namedex';

export type ReplayData = {
  gametype: string;
  genNum: number;
  turns: number;
  gameTime: number;
  stats: ReplayPlayer[];
  events: { player: number; turn: number; message: string }[];
};

export type ReplayPlayerOld = {
  username?: string;
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
  moveset: string[];
  kills: [number, number, number];
  damageDealt: [number, number];
  damageTaken: [number, number];
  hpRestored: number;
  status: 'brought' | 'survived' | 'fainted';
  fainted: boolean;
  brought: boolean;
};

type StatBreakdown = {
  direct: number;
  indirect: number;
  teammate: number;
};

export type ReplayPokemon = {
  id: PokemonId;
  name: string;
  shiny?: true;
  formes: PokemonId[];
  item?: string;
  kills: StatBreakdown;
  status: 'brought' | 'survived' | 'fainted';
  moveset: string[];
  damageDealt: StatBreakdown;
  damageTaken: StatBreakdown;
  hpRestored: number;
  calcLog: {
    damageDealt: {
      target: string;
      hpDiff: number;
      move: string;
    }[];
    damageTaken: {
      attacker: string;
      hpDiff: number;
      move: string;
    }[];
  };
};

export type ReplayPlayer = {
  username: string;
  win: boolean;
  stats: {
    switches: number;
  };
  total: {
    kills: number;
    deaths: number;
    damageDealt: number;
    damageTaken: number;
  };
  turnChart: {
    turn: number;
    damage: number;
    remaining: number;
  }[];
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
  team: ReplayPokemon[];
};

export type ReplayAnalysis = {
  gametype: string;
  genNum: number;
  turns: number;
  gameTime: number;
  players: ReplayPlayer[];
  events: { player: number; turn: number; message: string }[];
};

export type ReplayWarning = {
  message: string;
};

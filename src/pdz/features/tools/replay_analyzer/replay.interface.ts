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
  formes: { detail: string; id: string }[];
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
  id: string;
  name: string;
  shiny?: true;
  formes?: string[];
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

export type ReplayKOMon = {
  player: number;
  id: string;
  name: string;
  shiny?: true;
};

export type ReplayKO = {
  turn: number;
  victim: ReplayKOMon;
  attacker?: ReplayKOMon;
  move?: string;
  cause?: string;
  indirect: boolean;
  self: boolean;
};

export type ReplayAnalysis = {
  gametype: string;
  genNum: number;
  turns: number;
  gameTime: number;
  players: ReplayPlayer[];
  events: { player: number; turn: number; message: string }[];
  kos?: ReplayKO[];
};

export type ReplayAnalyzerVersion = 'v1' | 'v2';

export type ReplayWarning = {
  message: string;
};

export type ReplayArgWarning = {
  lineId: string;
  action: string;
  args: string[];
  message: string;
};

export type ReplayBuildWarning = {
  lineId: string;
  action: string;
  message: string;
};

export type ReplayWarnings = {
  args: ReplayArgWarning[];
  build: ReplayBuildWarning[];
  unknownActions: Record<string, number>;
};

export type ReplayData = {
  gametype: string;
  genNum: number;
  turns: number;
  gameTime: number;
  stats: {
    username: undefined | string;
    totalKills: number;
    totalDeaths: number;
    turnChart: { turn: number; damage: number }[];
    team: ReplayMon[];
    win: boolean;
    accuracy: {
      total: number;
      hits: number;
      expected: number;
      actual: number;
      luck: number;
    };
  }[];
  events: { player: number; turn: number; message: string }[];
};

export type ReplayMon = {
  name: string;
  kills: [number, number];
  damageDealt: number;
  damageTaken: number;
  hpRestored: number;
  fainted: boolean;
  brought: boolean;
};

export type ReplayData = {
  gametype: string;
  genNum: number;
  turns: number;
  gameTime: number;
  stats: {
    username: undefined | string;
    totalKills: number;
    totalDeaths: number;
    team: ReplayMon[];
    win: boolean;
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

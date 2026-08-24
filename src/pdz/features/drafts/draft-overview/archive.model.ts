
export type Archive = {
  _id: string;
  leagueName: string;

  teamName: string;
  format: number;
  ruleset: number;
  score: {
    wins: number;
    losses: number;
    diff: string;
  };
  owner: string;
  team: { id: string; name: string }[];
};

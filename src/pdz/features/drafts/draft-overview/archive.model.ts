export type Archive = {
  _id: string;
  leagueName: string;

  teamName: string;
  format: string;
  ruleset: string;
  score: {
    wins: number;
    losses: number;
    diff: string;
  };
  owner: string;
  team: { id: string; name: string }[];
  slug?: string;
};

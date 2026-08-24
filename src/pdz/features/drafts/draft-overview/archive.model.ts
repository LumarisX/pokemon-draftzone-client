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

  /**
   * Only set on leagues archived via the `archivedAt` flag, which are the only
   * ones that can be restored — entries from the frozen legacy `archives`
   * collection have no live draft to restore to.
   */
  slug?: string;
};

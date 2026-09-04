
export type Draft = {
  _id: string;
  leagueName: string;
  teamName: string;
  slug: string;
  format: string;
  ruleset: string;
  doc: string;
  coach?: string;
  score: {
    wins: number;
    losses: number;
    diff: string;
  };
  nextMatch?: string | null;
  owner: string;
  team: DraftPokemon[];
  unresolvedPokemon?: string[];
};

export type DraftPokemon = {
  id: string;
  name: string;
  unresolved?: boolean;
  shiny?: boolean;
  nickname?: string;
  draftFormes?: DraftPokemon[];
  modifiers?: {
    moves?: string[];
    abilities?: string[];
  };
  capt?: {
    tera?: string[];
    z?: string[];
    dmax?: boolean;
  };
};

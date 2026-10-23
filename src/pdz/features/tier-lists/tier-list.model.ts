import { StatsTable, Type } from '@pdz/shared/data';

export type TierPokemonAddon = {
  name: string;
  cost: number;
  capt?: {
    tera?: string[] | true;
    z?: string[];
    dmax?: boolean;
  };
};

export type TierPokemon = {
  name: string;
  id: string;
  types: [Type] | [Type, Type];
  abilities?: string[];
  stats: StatsTable;
  bst: number;
  notes?: string;
  draftBanned?: boolean;
  banned?: {
    moves?: string[];
    abilities?: string[];
    tera?: true;
  };
  addons?: TierPokemonAddon[];
  formes?: { id: string; name: string }[];
  draftFormes?: { id: string; name: string }[];
};

export type LeagueTier = {
  id?: string;
  name: string;
  cost?: number;
  pokemon: TierPokemon[];
};

export type TierListVisibility = 'private' | 'unlisted' | 'public';
export type TierListRole = 'editor' | 'viewer';
export type TierListAccess = 'manage' | 'edit' | 'view' | 'none';

export type TierListMeta = {
  slug: string;
  authorName: string | null;
  visibility: TierListVisibility;
  tags: string[];
  featured: boolean;
  version: number;
  forkCount: number;
  useCount: number;
  updatedAt: string | null;
  access: TierListAccess;
  role: 'owner' | TierListRole | null;
  retired: boolean;
  copiedFrom: {
    slug: string | null;
    name: string | null;
    authorName: string | null;
    behind: boolean;
  } | null;
  tournament: {
    name: string;
    leagueSlug: string;
    tournamentSlug: string;
    current: boolean;
  } | null;
};

export type TierListSettings = {
  name: string;
  description?: string;
  authorName?: string;
  visibility: TierListVisibility;
  tags: string[];
  format: string;
  ruleset: string;
  isTournamentCopy: boolean;
  access?: TierListAccess;
};

export type TierListChange =
  | { kind: 'tier-added'; tierId: string; name: string; cost: number }
  | { kind: 'tier-removed'; tierId: string; name: string; cost: number }
  | { kind: 'tier-renamed'; tierId: string; from: string; to: string }
  | { kind: 'tier-repriced'; tierId: string; name: string; from: number; to: number }
  | { kind: 'added'; pokemonId: string; name: string; tier?: string; cost?: number }
  | { kind: 'removed'; pokemonId: string; name: string; tier?: string; cost?: number }
  | {
      kind: 'moved';
      pokemonId: string;
      name: string;
      from?: string;
      to?: string;
      fromCost?: number;
      toCost?: number;
    }
  | { kind: 'banned'; pokemonId: string; name: string }
  | { kind: 'unbanned'; pokemonId: string; name: string }
  | { kind: 'details'; pokemonId: string; name: string }
  | {
      kind: 'ban-list';
      field: 'moves' | 'abilities';
      added: string[];
      removed: string[];
    };

export type TierListRevision = {
  version: number;
  at: string;
  actorName: string | null;
  kind: 'create' | 'edit' | 'import' | 'revert' | 'pull' | 'fork' | 'copy';
  summary: string;
  changeCount?: number;
  restoredFrom?: number;
};

export type TierListLegality = {
  format: string;
  ruleset: string;
  notInRuleset: { id: string; name: string; tier?: string }[];
  leftOff: { id: string; name: string }[];
  unusedBans: { moves: string[]; abilities: string[] };
  emptyTiers: string[];
  unpricedTiers: string[];
};

export type TierListMembers = {
  owner: { name: string | null; you: boolean };
  members: {
    id: string;
    name: string | null;
    role: TierListRole;
    you: boolean;
  }[];
  invites: {
    id: string;
    role: TierListRole;
    expiresAt: string;
    maxUses: number;
    uses: number;
  }[];
  canManage: boolean;
};

export type LayoutId =
  | 'tier-columns'
  | 'name-tier-rows'
  | 'name-cost-rows'
  | 'tier-blocks';

export type MatchStatus =
  | 'matched'
  | 'suggested'
  | 'ambiguous'
  | 'not-in-ruleset'
  | 'unmatched';

export type MatchOption = { id: string; name: string };

export type NameMatch = {
  status: MatchStatus;
  pokemon: MatchOption[];
  options?: MatchOption[];
  via?: 'exact' | 'alias' | 'forme' | 'remembered' | 'spelling';
};

export type ImportEntry = {
  text: string;
  row: number;
  col: number;
  note?: string;
  addons?: string[];
  match: NameMatch;
};

export type ImportTier = {
  name: string;
  cost?: number;
  banned: boolean;
  untiered: boolean;
  entries: ImportEntry[];
};

export type ImportPreview = {
  layout: LayoutId;
  layouts: { id: LayoutId; label: string; tierCount: number }[];
  tiers: ImportTier[];
  duplicates: { pokemonId: string; name: string; tiers: number[] }[];
  counts: {
    total: number;
    matched: number;
    suggested: number;
    ambiguous: number;
    notInRuleset: number;
    unmatched: number;
    duplicates: number;
  };
  rememberedCount: number;
};

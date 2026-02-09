import { Type } from '../../data';
import { TierPokemon } from '../../interfaces/tier-pokemon.interface';

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s/g, '');
}

type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'bst';

function parseStatFilter(search: string): {
  stat: StatKey;
  operator: '>' | '<' | '>=' | '<=';
  value: number;
} | null {
  const match = search.match(/^(hp|atk|def|spa|spd|spe|bst)(>=|<=|>|<)(\d+)$/);
  if (!match) return null;
  const [, stat, operator, value] = match as [
    string,
    StatKey,
    '>' | '<' | '>=' | '<=',
    string,
  ];
  return { stat, operator, value: Number(value) };
}

function matchesStatFilter(
  pokemon: TierPokemon,
  filter: {
    stat: StatKey;
    operator: '>' | '<' | '>=' | '<=';
    value: number;
  },
): boolean {
  const statValue =
    filter.stat === 'bst' ? pokemon.bst : pokemon.stats[filter.stat];
  switch (filter.operator) {
    case '>':
      return statValue > filter.value;
    case '<':
      return statValue < filter.value;
    case '>=':
      return statValue >= filter.value;
    case '<=':
      return statValue <= filter.value;
  }
}

export function filterBySearch(
  pokemon: TierPokemon,
  filteredTypes: Type[],
  searchText: string = '',
): boolean {
  const normalizedSearch = searchText.split(',').map(normalizeText);
  return (
    pokemon.types.some((type) => filteredTypes.includes(type)) &&
    normalizedSearch.every((search) => {
      if (search === '') return true;
      const statFilter = parseStatFilter(search);
      if (statFilter) return matchesStatFilter(pokemon, statFilter);

      return (
        pokemon.types.some((type) => normalizeText(type).includes(search)) ||
        pokemon.abilities?.some((ability) =>
          normalizeText(ability).includes(search),
        ) ||
        normalizeText(pokemon.name).includes(search)
      );
    })
  );
}

/**
 * Creates a ban string for Pokemon with restrictions
 */
export function makeBanString(banned?: {
  moves?: string[];
  abilities?: string[];
  tera?: true;
}): string {
  if (!banned) return '';
  const bans: string[] = [];
  if (banned.tera) bans.push('Terastalization');
  if (banned.abilities && banned.abilities.length > 0)
    bans.push(...banned.abilities);
  if (banned.moves && banned.moves.length > 0) bans.push(...banned.moves);
  return 'Banned: ' + bans.join(', ');
}

export type SortOption =
  | 'Name'
  | 'BST'
  | 'HP'
  | 'ATK'
  | 'DEF'
  | 'SPA'
  | 'SPD'
  | 'SPE';

export const SORT_OPTIONS: readonly SortOption[] = [
  'Name',
  'BST',
  'HP',
  'ATK',
  'DEF',
  'SPA',
  'SPD',
  'SPE',
] as const;

/**
 * Sort map for Pokemon by various stats
 */
export const SORT_MAP: Record<
  SortOption,
  (x: TierPokemon, y: TierPokemon) => number
> = {
  BST: (x, y) => y.bst - x.bst,
  HP: (x, y) => y.stats.hp - x.stats.hp,
  ATK: (x, y) => y.stats.atk - x.stats.atk,
  DEF: (x, y) => y.stats.def - x.stats.def,
  SPA: (x, y) => y.stats.spa - x.stats.spa,
  SPD: (x, y) => y.stats.spd - x.stats.spd,
  SPE: (x, y) => y.stats.spe - x.stats.spe,
  Name: (x, y) => x.id.localeCompare(y.id),
};

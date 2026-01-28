import { TierPokemon } from '../../interfaces/tier-pokemon.interface';
import { Type } from '../../data';

/**
 * Checks if a Pokemon matches the current type filter and search text
 */
export function typeInFilter(
  pokemon: TierPokemon,
  filteredTypes: Type[],
  searchText: string = '',
): boolean {
  const normalizedSearch = searchText.toLowerCase();
  if (
    normalizedSearch &&
    !pokemon.name.toLowerCase().includes(normalizedSearch)
  ) {
    return false;
  }

  if (filteredTypes.length === 0) return true;
  return pokemon.types.some((type) => filteredTypes.includes(type));
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

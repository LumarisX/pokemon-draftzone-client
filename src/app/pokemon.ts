import { BattlePokedex } from './pokedex';

export type PokemonId = keyof typeof BattlePokedex & string;

export function getSpriteName(
  pokemonId: PokemonId,
  source: 'ps' | 'serebii' | 'pd'
): string {
  return BattlePokedex[pokemonId] ? BattlePokedex[pokemonId][source] : '';
}

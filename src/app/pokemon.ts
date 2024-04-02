import { BattlePokedex } from './pokedex';

export type PokemonId = keyof typeof BattlePokedex & string;

export function getSpriteName(pokemonId: PokemonId): string {
  return BattlePokedex[pokemonId] ? BattlePokedex[pokemonId].ps : '';
}

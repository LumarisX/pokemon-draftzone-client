import { BattlePokedex } from './pokedex';

export type PokemonId = keyof typeof BattlePokedex & string;

export function getSpriteName(
  pokemonId: PokemonId,
  source: 'ps' | 'serebii' | 'pd'
): string {
  return BattlePokedex[pokemonId] ? BattlePokedex[pokemonId][source] : '';
}

export function getPidByName(name: string): PokemonId | null {
  name = name.toLowerCase();
  for (const key in BattlePokedex) {
    const pokemonNames = BattlePokedex[key].name;
    if (
      pokemonNames.some((pokemonName) => pokemonName.toLowerCase() === name)
    ) {
      return key;
    }
  }
  return null;
}

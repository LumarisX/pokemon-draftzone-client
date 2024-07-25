import { Pokedex, SpriteProperties } from './pokedex';

export type PokemonId = keyof typeof Pokedex & string;

export function getSpriteProperties(
  pokemonId: PokemonId,
  source: 'ps' | 'serebii' | 'pd' | 'pmd'
): SpriteProperties | undefined {
  if (Pokedex[pokemonId]) {
    return Pokedex[pokemonId][source];
  }
  return undefined;
}

export function getPidByName(name: string): PokemonId | null {
  name = name.toLowerCase();
  for (const key in Pokedex) {
    const pokemonNames = Pokedex[key].name;
    if (
      pokemonNames.some((pokemonName) => pokemonName.toLowerCase() === name)
    ) {
      return key;
    }
  }
  return null;
}

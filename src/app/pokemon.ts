import { BattlePokedex } from './pokedex';

export type PokemonId = keyof typeof BattlePokedex;

export function getSpriteName(pokemonId: PokemonId | ''): string {
  let spriteName: string;
  if (pokemonId == '') {
    return '';
  }
  let monData: Record<string, any> = BattlePokedex[pokemonId];
  if (monData == undefined) {
    return '0';
  }
  if ('baseSpecies' in BattlePokedex[pokemonId]) {
    spriteName =
      monData['baseSpecies'].toLowerCase().replace(/[\s-.]+/g, '') +
      '-' +
      monData['forme'].toLowerCase().replace(/[\s-.%]+/g, '');
  } else {
    spriteName = monData['name'].toLowerCase().replace(/[\s-.]+/g, '');
  }
  return spriteName;
}


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


export class Pokedex {
  data = []
  constructor(rulesetId: string = "Gen9 NatDex"){
    data = GET DATA FROM http://localhost:9960/data/namelist?ruleset=%22Paldea%20Dex%22
  }

  getName(pid: PokemonId): string {
    const specie = data.find(([pid, name]) => pid === "pikachu");
    return specie ? specie[1] : "";
  }
}
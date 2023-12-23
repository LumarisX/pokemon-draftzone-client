import { BattlePokedex } from "./pokedex";

export type Pokemon = keyof typeof BattlePokedex

export function getSpriteName(pokemonId: keyof typeof BattlePokedex):string {
    let spriteName: string;
    let monData: Record<string, any> = BattlePokedex[pokemonId]
    if(monData == undefined) {
        return "0";
    }
    if ("baseSpecies" in BattlePokedex[pokemonId]) {
        spriteName = monData["baseSpecies"].toLowerCase().replace(/\s-.]+/g, "") + "-" + monData["forme"].toLowerCase().replace(/[\s-.%]+/g, "");
    } else {
        spriteName = monData["name"].toLowerCase().replace(/[\s-.]+/g, "");
    }
    return spriteName;
}


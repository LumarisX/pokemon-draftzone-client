import { BattlePokedex } from "./pokedex";
import { BattleTypeChart } from "./typechart";

export interface Pokemon {
    pid: keyof typeof BattlePokedex;
    tera?: keyof typeof BattleTypeChart[];
    z?: keyof typeof BattleTypeChart[];
    shiny?: boolean;
    formes: keyof typeof BattlePokedex[]
}


export function getSpriteName(pokemon: Pokemon):string {
    let spriteName: string;
    let monData: Record<string, any> = BattlePokedex[pokemon.pid]
    if ("baseSpecies" in BattlePokedex[pokemon.pid]) {
        spriteName = monData["baseSpecies"].toLowerCase().replace(/\s-.]+/g, "") + "-" + monData["forme"].toLowerCase().replace(/[\s-.]+/g, "");
    } else {
        spriteName = monData["name"].toLowerCase().replace(/[\s-.]+/g, "");
    }
    return spriteName;
}

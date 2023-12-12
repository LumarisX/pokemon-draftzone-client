import { BattlePokedex } from "./pokedex";
import { BattleTypeChart, TypeList, valueToDamage } from "./typechart";

export class PokemonOld {

    id: keyof typeof BattlePokedex;
    tera: string[];
    z: boolean;
    shiny: boolean = false;
    name: string;



    constructor(id: keyof typeof BattlePokedex, tera: string[] = [], z: boolean, shiny?: boolean) {
        this.id = id;
        this.tera = tera;
        this.z = z;
        this.name = BattlePokedex[id].name;
    }

    getWeak() {
        let weak: number[] = [];
        for (let t of TypeList) {
            let typeWeak = 1;
            for (let type of BattlePokedex[this.id]["types"]) {
                let dt = BattleTypeChart[<keyof typeof BattleTypeChart>type.toLowerCase()]["damageTaken"];
                typeWeak = typeWeak * valueToDamage(dt[<keyof typeof dt>t]);
            }
            weak.push(typeWeak);
        }
        return weak
    }

    getSpriteName():string {
        let spriteName: string;
        let monData: Record<string, any> = BattlePokedex[this.id]
        if ("baseSpecies" in BattlePokedex[this.id]) {
            spriteName = monData["baseSpecies"].toLowerCase().replace(/\s-.]+/g, "") + "-" + monData["forme"].toLowerCase().replace(/[\s-.]+/g, "");
        } else {
            spriteName = monData["name"].toLowerCase().replace(/[\s-.]+/g, "");
        }
        return spriteName;
    }
}

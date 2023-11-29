import { BattlePokedex } from "./pokedex";
import { BattleTypeChart, TypeList, valueToDamage } from "./typechart";

export class Pokemon {

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
}

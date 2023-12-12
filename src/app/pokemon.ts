import { BattlePokedex } from "./pokedex";
import { BattleTypeChart } from "./typechart";

export interface Pokemon {
    pid: keyof typeof BattlePokedex;
    tera?: keyof typeof BattleTypeChart[];
    z?: keyof typeof BattleTypeChart[];
    shiny?: boolean;
    formes: keyof typeof BattlePokedex[]
}

import { BattlePokedex } from "../pokedex";

export interface Speedtier {
    name: string;
    speed: number;
    modifiers: string[];
    team?: string;
}

export interface SummeryChart {
    blueTeam: Summery[];
    redTeam: Summery[]
}

export interface Summery {
    pid: keyof typeof BattlePokedex;
    name: string;
    abilities: string[];
    types: string[];
    baseStats: {
        hp: number,
        atk: number,
        def: number,
        spa: number,
        spd: number,
        spe: number
    }
}
import { BattlePokedex } from "../pokedex";

export type Speedtier = {
    name: string;
    speed: number;
    modifiers: string[];
    team?: string;
}

export type Summery = {
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

export type Typechart = {
    team: {
        pid: keyof typeof BattlePokedex;
        weak: Types
    }[]
    weaknesses: Types;
    resistances: Types;
    difference: Types;
    differential: Types;
}

export type Types = {
    Bug: number,
    Dark: number,
    Dragon: number,
    Electric: number,
    Fairy: number,
    Fighting: number,
    Fire: number,
    Flying: number,
    Ghost: number,
    Grass: number,
    Ground: number,
    Ice: number,
    Normal: number,
    Poison: number,
    Psychic: number,
    Rock: number,
    Steel: number,
    Water: number,
    brn: number,
    par: number,
    prankster: number,
    tox: number,
    psn: number,
    frz: number,
    slp: number,
    powder: number,
    sandstorm: number,
    hail: number,
    trapped: number
}
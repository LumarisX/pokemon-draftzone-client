import { BattlePokedex } from "../pokedex";
import { Pokemon } from "../pokemon";

export type Speedtier = {
    name: string;
    speed: number;
    modifiers: string[];
    team?: boolean;
    stick?: boolean;
    base?: boolean;
}

export type Summery = {
    team: [{
        pid: keyof typeof BattlePokedex,
        name: string,
        captain: boolean
        abilities: string[],
        types: string[],
        baseStats: {
            hp: number,
            atk: number,
            def: number,
            spa: number,
            spd: number,
            spe: number
        }
    }],
    stats: {
        mean: {
            hp: number,
            atk: number,
            def: number,
            spa: number,
            spd: number,
            spe: number
        },
        median: {
            hp: number,
            atk: number,
            def: number,
            spa: number,
            spd: number,
            spe: number
        },
        max: {
            hp: number,
            atk: number,
            def: number,
            spa: number,
            spd: number,
            spe: number
        }
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

export type Movechart = [
    {
        catName: string;
        moves: [
            {
                moveName: string;
                pokemon: [keyof typeof BattlePokedex]
            }
        ]
    }
]

export type Coveragechart = {
    pid: Pokemon;
    coverage: {
        physical: [
            {
                name: string
                stab: boolean
                type: keyof Types
                recommended?: boolean
            }
        ],
        special: [
            {
                name: string
                stab: boolean
                type: keyof Types
                recommended?: boolean
            }
        ]
    }
}
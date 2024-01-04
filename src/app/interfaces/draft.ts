import { Pokemon } from "../pokemon";

export type Draft = {
    _id: string;
    leagueName?: string;
    leagueId: string;
    format: number;
    ruleset: number;
    owner: string;
    team: Team[];
}

type Team = {
    pid: Pokemon
}

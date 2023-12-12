import { Pokemon } from "./pokemon";

export interface Team {
    leagueName: string;
    leagueId: string;
    format: string;
    ruleset: string; 
    team: Pokemon[];
}

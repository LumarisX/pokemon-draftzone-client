import { Pokemon } from "./pokemon";

export interface Team {
    leagueName?: string;
    leagueId: string;
    format: number;
    ruleset: string; 
    team?: Pokemon[];
    opponent_team_id: string;
}

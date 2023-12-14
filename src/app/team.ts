import { Pokemon } from "./pokemon";

export interface Draft{
    leagueName?: string;
    leagueId: string;
    format: number;
    ruleset: number; 
    opponent_team_id: string;
    opponents: OpponentDraft[]
    owner: string;
    team: Pokemon[];
}

export interface OpponentDraft{
    teamName: string;
    score: number[];
    stage: string;
    team: Pokemon[];
}

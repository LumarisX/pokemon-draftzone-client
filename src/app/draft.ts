import { Pokemon } from "./pokemon";

export type Draft = {
    _id: string;
    leagueName?: string;
    leagueId: string;
    format: number;
    ruleset: number;
    opponent_team_id: string;
    opponents: OpponentDraft[]
    owner: string;
    team: Team[];
}

export type OpponentDraft = {
    opponentName: string;
    score: number[];
    stage: string;
    team: Team[];
}

type Team = {
    pid: Pokemon
}

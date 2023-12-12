import { Pokemon } from "./pokemon";
import { ObjectID } from "mongodb";

export interface Team {
    leagueName?: string;
    leagueId: string;
    format: string;
    ruleset: string; 
    team?: Pokemon[];
    opponent_team_id: ObjectID;
}

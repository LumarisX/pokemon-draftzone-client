import { Pokemon } from "./pokemon";

export interface Team {
    name: string;
    id: string;
    format: string;
    ruleset: string; 
    members: Pokemon[];

}

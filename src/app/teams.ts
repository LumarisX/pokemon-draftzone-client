import { Pkmn } from "./pkmn";

export interface Team {
    name: string;
    id: string;
    members: [Pkmn];

}

import { Pokemon } from '../interfaces/draft';

export namespace League {
  export type Team = {
    teamName: string;
    coaches: string[];
    logo: string;
  };

  export type TieredPokemon = {
    name: string;
    id: string;
    tier: string | number;
  };

  type MatchTeam = {
    teamName: string;
    coach: string;
    score: number;
    logo: string;
  };

  type MatchPokemon = Pokemon & {
    status?: 'brought' | 'fainted';
  };

  export type Matchup = {
    team1: MatchTeam;
    team2: MatchTeam;
    matches: {
      link: string;
      team1: { team: MatchPokemon[]; score: number; winner?: boolean };
      team2: { team: MatchPokemon[]; score: number; winner?: boolean };
    }[];
  };

  export type Rule = {
    title: string;
    body: string;
  };
}

type TradeParticipant = {
  team?: League.Team;
  pokemon?: League.TieredPokemon[];
};

export type TradeLog = {
  from: TradeParticipant;
  to: TradeParticipant;
  activeStage: string;
};

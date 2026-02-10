import {
  Coverage,
  MoveChart,
  TypeChart,
  Summary,
} from '../drafts/matchup-overview/matchup-interface';
import { DraftPokemon } from '../interfaces/draft';
import { Pokemon } from '../interfaces/pokemon';

export namespace League {
  export type LeagueTeam = {
    name: string;
    id: string;
    logo?: string;
    draft: LeaguePokemon[];
    picks: LeaguePokemon[][];
    isCoach: boolean;
    coach: string;

    pointTotal: number;
    record?: {
      wins: number;
      losses: number;
      diff: number;
    };
    timezone?: string;
  };

  export type LeaguePokemon = DraftPokemon & {
    tier: string | string;
    record?: {
      deaths: number;
      kills: number;
      brought: number;
    };
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

  type MatchPokemon = DraftPokemon & {
    status?: 'brought' | 'fainted';
  };

  export type Matchup = {
    team1: MatchTeam;
    team2: MatchTeam;
    matches: {
      link: string;
      team1: { team: MatchPokemon[]; score: number; winner: boolean };
      team2: { team: MatchPokemon[]; score: number; winner: boolean };
    }[];
  };

  export type Stage = {
    _id: string;
    name: string;
    matchups: Matchup[];
  };
  export type RuleSection = {
    title: string;
    body: string;
  };

  export type PowerRankingTeam = {
    info: { name: string; index: number; id: string };
    coverage: Coverage;
    movechart: MoveChart;
    typechart: TypeChart;
    summary: Summary;
    score?: number;
  };

  export type DraftRound = {
    teamName: string;
    status?: string;
    pokemon?: Pokemon;
  }[];

  export type LeagueSignUp = {
    id: string;
    name: string;
    gameName: string;
    discordName: string;
    timezone: string;
    experience: string;
    dropped?: string;
    status: string;
    teamName: string;
    logo?: string;
    signedUpAt: Date;
    division?: string;
  };

  export type DraftPick = {
    pokemon: LeaguePokemon;
    timestamp: Date;
    picker: string;
  };

  export type DraftTeam = {
    id: string;
    name: string;
    draft: DraftPick[];
  };

  export type TeamStandingData = {
    name: string;
    results: number[];
    coaches: string[];
    streak: number;
    direction?: number;
    wins: number;
    loses: number;
    diff: number;
    logo?: string;
  };

  export type CoachStandingData = {
    cutoff: number;
    weeks: number;
    teams: TeamStandingData[];
  };

  export type PokemonStanding = Pokemon<{
    direction?: number;
    coach: string;
    teamName: string;
    record: {
      brought: number;
      kills: number;
      deaths: number;
      diff: number;
    };
  }>;

  export type LeagueInfo = {
    name: string;
    tournamentKey: string;
    description?: string;
    format: string;
    ruleset: string;
    signUpDeadline: Date;
    draftStart?: Date;
    draftEnd?: Date;
    seasonStart?: Date;
    seasonEnd?: Date;
    logo?: string;
    divisions: { name: string; divisionKey: string }[];
    discord?: string;
  };
}

export type Team = {
  name: string;
  coach: string;
  logo: string;
};

type TradeParticipant = {
  team?: Team;
  pokemon?: League.TieredPokemon[];
};

export type TradeLog = {
  from: TradeParticipant;
  to: TradeParticipant;
  activeStage: string;
};

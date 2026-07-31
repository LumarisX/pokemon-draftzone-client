import {
  Coverage,
  MoveChart,
  TypeChart,
  Summary,
} from '../drafts/matchup-overview/matchup-interface';
import { DraftPokemon } from '../drafts/draft.model';
import { Pokemon } from '@pdz/core/utils/pokemon';
import { Type } from '@pdz/shared/data';

export namespace League {
  export type Team = {
    id: string;
    name: string;
    coach: string;
    logo?: string;
  };

  export type LeagueTeam = {
    name: string;
    id: string;
    logo?: string;
    draft: LeaguePokemon[];
    picks: LeaguePokemon[][];
    isCoach: boolean;
    coach: string;
    /** Id of the coach who owns the team; needed to edit their profile. */
    coachId?: string;
    /** Contact handles are only returned to the team's own coach. */
    gameName?: string;
    discordName?: string;
    pointTotal: number;
    record?: {
      wins: number;
      losses: number;
      gameDiff: number;
      pokemonDiff: number;
    };
    diffMode?: 'game' | 'pokemon';
    timezone?: string;
  };

  export type LeaguePokemon = DraftPokemon & {
    tier: string;
    cost: number;
    types?: Type[];
    addons?: string[];
    /** Coach who made the pick; absent on legacy picks with an unresolvable picker. */
    picker?: string;
    timestamp?: Date;
    record?: {
      deaths: number;
      kills: number;
      brought: number;
    };
  };

  export type TieredPokemon = Pokemon & {
    tier: string;
    cost: number;
    tera?: boolean;
  };

  export type MatchPokemonStats = {
    kills?: {
      direct?: number;
      indirect?: number;
      teammate?: number;
    };
    status: 'brought' | 'survived' | 'fainted';
  };

  export type MatchTeamStats = {
    [key: string]: MatchPokemonStats;
  };

  export type Matchup = {
    id: string;
    team1: Team & { score: number; draft: DraftPokemon[] };
    team2: Team & { score: number; draft: DraftPokemon[] };
    matches: {
      link: string;
      team1: {
        team: MatchTeamStats;
        score: number;
        winner: boolean;
      };
      team2: {
        team: MatchTeamStats;
        score: number;
        winner: boolean;
      };
    }[];
    scheduledDate?: Date;
    notes?: string;
    winner?: 'side1' | 'side2' | 'draw';
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

  export type SignUpStatus = 'approved' | 'pending' | 'denied';

  export type LeagueSignUp = {
    id: string;
    teamId?: string;
    name: string;
    gameName: string;
    discordName: string;
    timezone: string;
    experience: string;
    dropped?: string;
    status: SignUpStatus;
    teamName: string;
    logo?: string;
    signedUpAt: Date;
    draft?: string;
    hasDiscordRole?: boolean;
    inDiscordServer?: boolean;
    hasValidTeam?: boolean;
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
    results: ({
      outcome: 'w' | 'l' | 't' | 'ff';
      score: number;
    } | null)[];
    coach: string;
    coaches?: string[];
    streak: number;
    direction?: number;
    wins: number;
    losses: number;
    gameDiff: number;
    pokemonDiff: number;
    logo?: string;
  };

  export type CoachStandingData = {
    cutoff: number;
    diffMode: 'game' | 'pokemon';
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
    tournamentSlug: string;
    description?: string;
    format: string;
    ruleset: string;
    signUpDeadline: Date;
    draftStart?: Date;
    draftEnd?: Date;
    seasonStart?: Date;
    seasonEnd?: Date;
    logo?: string;
    drafts: { name: string; draftSlug: string }[];
    discord?: string;
    tierListId?: string;
    draftCount?: { min: number; max: number };
    pointTotal?: number;
  };

  export type TournamentSummary = {
    name: string;
    tournamentSlug: string;
    description?: string;
    format: string;
    ruleset: string;
    signUpDeadline: Date;
    draftStart?: Date;
    draftEnd?: Date;
    seasonStart?: Date;
    seasonEnd?: Date;
    logo?: string;
    discord?: string;
  };

  export type LeagueSummary = {
    name: string;
    leagueSlug: string;
    description?: string;
    logo?: string;
    tournaments: TournamentSummary[];
  };

  export type CoachProfile = {
    name: string;
    gameName: string;
    discordName: string;
    timezone: string;
    teamName: string;
    status: string;
    logo?: string;
    signedUpAt: Date;
    teamId?: string;
    draft?: { draftSlug: string; name: string };
    inDiscordServer: boolean;
  };

  /** Mirrors the server's STAGE_TYPES enum. */
  export type StageType =
    | 'round-robin'
    | 'single-elimination'
    | 'double-elimination'
    | 'swiss'
    | 'custom';

  export type StageSummary = {
    _id: string;
    name: string;
    type: string;
    order: number;
    currentRoundIndex: number;
    /** Hidden stages are only listed for organizers. */
    public: boolean;
  };
}

type TradeParticipant = {
  team?: League.Team;
  pokemon: League.TieredPokemon[];
  /** Trade points charged to this side's team; 0 for free agency. */
  tradePoints?: number;
};

export type TradeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type TradeLog = {
  /** Absent on trades predating the trade-id backfill. */
  id?: string;
  /** Index of the round the trade takes effect in. */
  activeRound: number;
  side1: TradeParticipant;
  side2: TradeParticipant;
  timestamp: Date;
  status: TradeStatus;
};

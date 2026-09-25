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
  export type PicksVisibleTo = 'everyone' | 'ownTeam';

  export type Team = {
    id: string;
    slug: string;
    name: string;
    coach: string;
    logo?: string;
  };

  export type LeagueTeam = {
    name: string;
    id: string;
    slug: string;
    logo?: string;
    draft: LeaguePokemon[];
    picks: LeaguePokemon[][];
    isCoach: boolean;
    coach: string;
    coachId?: string;
    gameName?: string;
    discordName?: string;
    pointTotal: number;
    picksHidden?: boolean;
    pickCount?: number;
    record?: {
      wins: number;
      draws?: number;
      losses: number;
      points?: number;
      gameDiff: number;
      pokemonDiff: number;
    };
    diffMode?: 'game' | 'pokemon';
    timezone?: string;
  };

  export type LeaguePokemon = DraftPokemon & {
    tier: string;
    cost: number;
    missingFromTierList?: boolean;
    types?: Type[];
    addons?: string[];
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
    missingFromTierList?: boolean;
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

  export type MatchupWinner =
    | 'side1'
    | 'side2'
    | 'draw'
    | 'side1ffw'
    | 'side2ffw'
    | 'dffl';

  export type MatchupSide = Omit<Team, 'id' | 'slug'> & {
    id: string | null;
    slug: string | null;
    from: { slug: string; label: string } | null;
    score: number;
    draft: DraftPokemon[];
  };

  export type Matchup = {
    id: string;
    slug: string;
    label?: string;
    team1: MatchupSide;
    team2: MatchupSide;
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
    scheduledDate?: string | null;
    notes?: string;
    winner?: MatchupWinner;
    advances?: 'side1' | 'side2' | 'none' | null;
    advancementBlocked?: boolean;
    status?: 'pending' | 'approved';
    report?: {
      submittedByName: string;
      submittedAt: string;
      score: { team1: number; team2: number };
      winner?: 'side1' | 'side2' | 'draw';
      forfeit?: boolean;
      notes?: string;
    };
  };

  export type Stage = {
    _id: string;
    slug: string;
    name: string;
    matchups: Matchup[];
  };

  export type ScheduleRound = {
    _id: string;
    name: string;
    matchDeadline?: string | null;
    stages: {
      _id: string;
      slug: string;
      name: string;
      type: string;
      matchups: Matchup[];
    }[];
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

  export type SignUpStatus =
    | 'approved'
    | 'pending'
    | 'waitlisted'
    | 'denied'
    | 'dropped';

  export type TournamentOrganizer = {
    sub: string;
    name: string | null;
    isOwner: boolean;
    isYou: boolean;
  };

  export type OrganizerInvite = {
    id: string;
    name: string;
    createdAt: string | null;
    expiresAt: string;
  };

  export type OrganizerCandidate = {
    coachId: string;
    name: string;
    teamName: string;
  };

  export type TournamentOrganizers = {
    canEdit: boolean;
    organizers: TournamentOrganizer[];
    invites: OrganizerInvite[];
    candidates: OrganizerCandidate[];
  };

  export type CreatedOrganizerInvite = TournamentOrganizers & {
    created: { id: string; token: string };
  };

  export type OrganizerInvitePreview = {
    tournamentName: string;
    leagueName: string;
    invitedBy: string | null;
    suggestedName: string;
    expiresAt: string;
    alreadyOrganizer: boolean;
  };

  export type LeagueSignUp = {
    id?: string;
    applicationId: string;
    intent?: 'team' | 'sub';
    answers?: { questionId: string; label: string; values: string[] }[];
    teamId?: string;
    teamSlug?: string;
    name: string;
    gameName: string;
    discordName: string;
    timezone: string;
    experience: string;
    dropped?: string;
    status: SignUpStatus;
    departed?: boolean;
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
      outcome: 'w' | 'd' | 'l' | 't' | 'ff';
      score: number;
    } | null)[];
    coach: string;
    coaches?: string[];
    streak: number;
    direction?: number;
    wins: number;
    draws?: number;
    losses: number;
    points?: number;
    gameDiff: number;
    pokemonDiff: number;
    logo?: string;
    id: string;
    teamSlug?: string;
  };

  export type Tiebreaker =
    | 'headToHead'
    | 'gameDiff'
    | 'pokemonDiff'
    | 'strengthOfSchedule';

  export type StandingsRules = {
    points: { win: number; draw: number; loss: number };
    tiebreakers: Tiebreaker[];
  };

  export type TeamStandingsTable = {
    diffMode: 'game' | 'pokemon';
    rules?: StandingsRules;
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

  export type StandingsFilter = { value: string; label: string };

  export type StandingsView = {
    teamStandings: TeamStandingsTable;
    pokemonStandings: PokemonStanding[];
  };

  export type SignUpQuestionType =
    | 'short'
    | 'long'
    | 'choice'
    | 'multi'
    | 'boolean';

  export type SignUpQuestion = {
    id: string;
    label: string;
    help?: string;
    type: SignUpQuestionType;
    options: string[];
    required: boolean;
    maxLength?: number;
    dependsOn?: { questionId: string; equals: string };
  };

  export type SignUpAnswer = { questionId: string; values: string[] };

  export type SignUpAccessMode = 'open' | 'invite' | 'closed';

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
    signUpAccess?: SignUpAccessMode;
    signUpQuestions?: SignUpQuestion[];
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
    teamSlug?: string;
    draft?: { draftSlug: string; name: string };
    inDiscordServer: boolean;
  };

  export type SignUpResult = {
    message: string;
    applicationId: string;
    tournamentId: string;
    status: SignUpStatus;
  };

  export type StageType =
    | 'round-robin'
    | 'single-elimination'
    | 'double-elimination'
    | 'swiss'
    | 'custom';

  export type StageSummary = {
    _id: string;
    slug: string;
    name: string;
    type: string;
    order: number;
    public: boolean;
  };
}

export type TradePokemon = Pokemon & {
  cost?: number;
  tier?: string;
  tera?: boolean;
  missingFromTierList?: boolean;
};

export type TradeParticipant = {
  team?: League.Team;
  pokemon: TradePokemon[];
  tradePoints?: number;
};

export type TradeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SelectedTradePokemon = { id: string; tera: boolean };

export type TradeSide = {
  team?: string;
  pokemon: SelectedTradePokemon[];
  tradePoints?: number;
};

export type TradeData = {
  side1: TradeSide;
  side2: TradeSide;
  roundIndex: number;
};

export type TradeLog = {
  id?: string;
  activeRound: number;
  side1: TradeParticipant;
  side2: TradeParticipant;
  timestamp: Date;
  status: TradeStatus;
};

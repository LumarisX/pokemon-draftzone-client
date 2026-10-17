import {
  DraftArea,
  draftLinks,
} from '@pdz/features/drafts/draft-area';
import {
  DraftService,
  PokemonStat,
} from '@pdz/features/drafts/draft-overview/draft.service';
import { Draft, DraftPokemon } from '@pdz/features/drafts/draft.model';
import { Opponent } from '@pdz/features/drafts/opponent-overview/opponent.model';
import {
  MatchPokemonStat,
  MatchTeam,
} from '@pdz/features/drafts/matchup-overview/matchup.model';
import {
  GameLineup,
  gameResult,
  SeasonResult,
  SeasonRow,
} from '@pdz/features/league-zone/league-team/team-season/team-season.component';
import { TeamRosterLine } from '@pdz/shared/data/team-roster/team-roster.component';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

export type SeasonMatch = {
  id: string;
  stage: string;
  opponent: Opponent;
  score: [number, number] | null;
  result: SeasonResult | null;
  when: string | null;
  link: string[];
  replays: string[];
};

export type DraftSeason = {
  draft: Draft;
  matches: SeasonMatch[];
  rows: SeasonRow[];
  roster: TeamRosterLine[];
  hasStats: boolean;
};

export type DraftSeasonLoad =
  | { state: 'ready'; season: DraftSeason }
  | { state: 'failed' };

function matchScore(opponent: Opponent): [number, number] | null {
  const matches = opponent.matches ?? [];
  if (matches.length > 1) {
    return matches.reduce<[number, number]>(
      ([a, b], match) => [
        a + (match.winner === 'a' ? 1 : 0),
        b + (match.winner === 'b' ? 1 : 0),
      ],
      [0, 0],
    );
  }
  if (matches.length === 1) {
    return [matches[0].aTeam?.score ?? 0, matches[0].bTeam?.score ?? 0];
  }
  return null;
}

function resultOf(score: [number, number] | null): SeasonResult | null {
  if (!score) return null;
  if (score[0] > score[1]) return 'win';
  if (score[0] < score[1]) return 'loss';
  return 'draw';
}

function toMatch(
  opponent: Opponent,
  matchupLink: (id: string) => string[],
): SeasonMatch {
  const score = matchScore(opponent);
  return {
    id: opponent._id,
    stage: opponent.stage,
    opponent,
    score,
    result: resultOf(score),
    when: opponent.scheduledDate ?? null,
    link: matchupLink(opponent._id),
    replays: (opponent.matches ?? [])
      .map((match) => match.replay)
      .filter((replay): replay is string => !!replay),
  };
}

function statEntries(
  stats: MatchTeam['stats'] | Record<string, MatchPokemonStat> | undefined,
): [string, MatchPokemonStat][] {
  if (!stats) return [];
  return Array.isArray(stats) ? stats : Object.entries(stats);
}

function lineup(team: MatchTeam | undefined): GameLineup {
  return statEntries(team?.stats)
    .filter(([, stat]) => stat.status || (stat.brought ?? 0) > 0)
    .map(([id, stat]) => ({
      id,
      fainted: stat.status === 'fainted' || (stat.deaths ?? 0) > 0,
    }));
}

function toRow(match: SeasonMatch): SeasonRow {
  const games = match.opponent.matches ?? [];
  return {
    id: match.id,
    round: match.stage,
    opponent: {
      name: match.opponent.teamName,
      coach: match.opponent.coach ?? null,
      logo: undefined,
    },
    result: match.result,
    forfeit: false,
    score: match.score
      ? { mine: match.score[0], theirs: match.score[1] }
      : null,
    when: match.when,
    exactTime: !!match.when,
    link: match.link,
    roster: match.opponent.team,
    games: games.map((game) => ({
      mine: game.aTeam?.score ?? 0,
      theirs: game.bTeam?.score ?? 0,
      result: gameResult(game.winner === 'a', game.winner === 'b'),
      replay: game.replay || null,
    })),
    lineups: games.map((game) => lineup(game.bTeam)),
  };
}

function rosterLines(
  team: DraftPokemon[],
  stats: PokemonStat[],
): TeamRosterLine[] {
  return team.map((pokemon) => {
    const stat = stats.find((entry) => entry.pokemon.id === pokemon.id);
    return {
      pokemon,
      brought: stat?.brought ?? 0,
      kills: stat?.kills ?? 0,
      indirect: stat?.indirect ?? 0,
      deaths: stat?.deaths ?? 0,
    };
  });
}

export function buildSeason(
  draft: Draft,
  opponents: Opponent[],
  stats: PokemonStat[] | null,
  matchupLink: (id: string) => string[],
): DraftSeason {
  const matches = opponents.map((opponent) => toMatch(opponent, matchupLink));
  return {
    draft,
    matches,
    rows: matches.map(toRow),
    roster: rosterLines(draft.team, stats ?? []),
    hasStats: !!stats?.length,
  };
}

export function loadSeason(
  service: DraftService,
  teamId: string,
  area: DraftArea,
): Observable<DraftSeasonLoad> {
  const links = draftLinks(teamId, area);
  return forkJoin({
    draft: service.getDraft(teamId),
    opponents: service
      .getMatchupList(teamId)
      .pipe(catchError(() => of([] as Opponent[]))),
    stats: service.getStats(teamId).pipe(
      map((stats) => stats.pokemon),
      catchError(() => of(null)),
    ),
  }).pipe(
    map(
      ({ draft, opponents, stats }): DraftSeasonLoad => ({
        state: 'ready',
        season: buildSeason(draft, opponents, stats, links.matchup),
      }),
    ),
    catchError(() => of<DraftSeasonLoad>({ state: 'failed' })),
  );
}

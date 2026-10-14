import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import {
  DraftService,
  PokemonStat,
} from '@pdz/features/drafts/draft-overview/draft.service';
import { Draft, DraftPokemon } from '@pdz/features/drafts/draft.model';
import { Opponent } from '@pdz/features/drafts/opponent-overview/opponent.model';
import {
  SeasonResult,
  SeasonRow,
} from '@pdz/features/league-zone/league-team/team-season/team-season.component';
import { SeasonMvpStat } from '@pdz/shared/data/season-mvp/season-mvp.component';
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

export type RosterLine = {
  pokemon: DraftPokemon;
  brought: number;
  kills: number;
  indirect: number;
  deaths: number;
  knockouts: number;
};

export type DraftSeason = {
  draft: Draft;
  matches: SeasonMatch[];
  rows: SeasonRow[];
  next: SeasonMatch | null;
  roster: RosterLine[];
  mvp: RosterLine | null;
  mvpStats: SeasonMvpStat[];
  totals: { kills: number; indirect: number; deaths: number };
  hasStats: boolean;
};

export type DraftSeasonLoad =
  | { state: 'ready'; season: DraftSeason }
  | { state: 'failed' };

const SCORING_GRACE_MS = 24 * 60 * 60 * 1000;

export function draftLinks(teamId: string) {
  const base = ['/', DRAFT_OVERVIEW_PATH, teamId];
  return {
    page: base,
    form: [...base, 'form'],
    score: [...base, 'score'],
    matchup: (id: string) => [...base, 'matchup', id],
    edit: ['/', DRAFT_OVERVIEW_PATH, 'edit'],
  };
}

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

export function pickNext(
  matches: SeasonMatch[],
  now = Date.now(),
): SeasonMatch | null {
  const unscored = matches.filter((match) => match.result === null);
  const scheduled = unscored
    .filter(
      (match) =>
        match.when && new Date(match.when).getTime() > now - SCORING_GRACE_MS,
    )
    .sort(
      (a, b) => new Date(a.when!).getTime() - new Date(b.when!).getTime(),
    );
  return scheduled[0] ?? unscored.find((match) => !match.when) ?? null;
}

function toRow(match: SeasonMatch, next: boolean): SeasonRow {
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
    next,
    roster: next ? match.opponent.team : [],
  };
}

function rosterLines(team: DraftPokemon[], stats: PokemonStat[]): RosterLine[] {
  return team.map((pokemon) => {
    const stat = stats.find((entry) => entry.pokemon.id === pokemon.id);
    const kills = stat?.kills ?? 0;
    const indirect = stat?.indirect ?? 0;
    return {
      pokemon,
      brought: stat?.brought ?? 0,
      kills,
      indirect,
      deaths: stat?.deaths ?? 0,
      knockouts: kills + indirect,
    };
  });
}

function byAces(a: RosterLine, b: RosterLine): number {
  return (
    b.knockouts - a.knockouts || a.deaths - b.deaths || a.brought - b.brought
  );
}

function mvpStats(mvp: RosterLine, teamKnockouts: number): SeasonMvpStat[] {
  return [
    { label: 'Games', value: mvp.brought },
    { label: 'Fainted', value: mvp.deaths },
    {
      label: 'KOs/Game',
      value: mvp.brought ? (mvp.knockouts / mvp.brought).toFixed(1) : '—',
    },
    {
      label: 'Team KOs',
      value: teamKnockouts
        ? `${Math.round((mvp.knockouts / teamKnockouts) * 100)}%`
        : '—',
    },
  ];
}

export function buildSeason(
  draft: Draft,
  opponents: Opponent[],
  stats: PokemonStat[] | null,
  matchupLink: (id: string) => string[],
): DraftSeason {
  const matches = opponents.map((opponent) => toMatch(opponent, matchupLink));
  const next = draft.completedAt ? null : pickNext(matches);
  const roster = rosterLines(draft.team, stats ?? []);
  const ranked = [...roster].sort(byAces);
  const totals = roster.reduce(
    (sum, line) => ({
      kills: sum.kills + line.kills,
      indirect: sum.indirect + line.indirect,
      deaths: sum.deaths + line.deaths,
    }),
    { kills: 0, indirect: 0, deaths: 0 },
  );
  const mvp = ranked[0] && ranked[0].knockouts > 0 ? ranked[0] : null;
  return {
    draft,
    matches,
    rows: matches.map((match) => toRow(match, match === next)),
    next,
    roster,
    mvp,
    mvpStats: mvp ? mvpStats(mvp, totals.kills + totals.indirect) : [],
    totals,
    hasStats: !!stats?.length,
  };
}

export function loadSeason(
  service: DraftService,
  teamId: string,
): Observable<DraftSeasonLoad> {
  const links = draftLinks(teamId);
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

export function killRatio(line: RosterLine): string {
  if (line.deaths) return (line.knockouts / line.deaths).toFixed(1);
  return line.knockouts > 0 ? `${line.knockouts}` : '—';
}

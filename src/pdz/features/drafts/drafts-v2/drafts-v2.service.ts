import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { DRAFT_OVERVIEW_PATH, LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { Archive } from '@pdz/features/drafts/draft-overview/archive.model';
import {
  DraftService,
  PokemonStat,
} from '@pdz/features/drafts/draft-overview/draft.service';
import { Draft } from '@pdz/features/drafts/draft.model';
import { Match } from '@pdz/features/drafts/matchup-overview/matchup.model';
import { Opponent } from '@pdz/features/drafts/opponent-overview/opponent.model';
import { League } from '@pdz/features/league-zone/league.interface';
import { TournamentDetails } from '@pdz/features/league-zone/league.model';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { getNameByPid } from '@pdz/shared/data/namedex';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  take,
} from 'rxjs';
import {
  MatchGame,
  RosterLeader,
  RosterMon,
  Season,
  SeasonDetail,
  SeasonMatch,
} from './drafts-v2.model';

type TournamentTeam = {
  slug: string;
  name: string;
  draft: League.LeaguePokemon[];
  record?: { wins: number; losses: number; gameDiff: number };
};

type TournamentSchedule = {
  rounds: League.ScheduleRound[];
  currentRoundIndex: number;
};

type TournamentTeamList = {
  teams: { id: string; slug: string }[];
};

const FAILED: SeasonDetail = {
  matches: [],
  leaders: [],
  hasSchedule: false,
  failed: true,
};

@Injectable({ providedIn: 'root' })
export class DraftsV2Service {
  private readonly api = inject(ApiService);
  private readonly draftService = inject(DraftService);
  private readonly leagueService = inject(LeagueZoneService);

  loadSeasons(): Observable<{ seasons: Season[]; failed: boolean }> {
    return forkJoin({
      drafts: this.draftService.getDraftsList().pipe(
        take(1),
        map((data) => data.drafts ?? []),
        catchError(() => of(null)),
      ),
      tournaments: this.leagueService.getTournamentsList().pipe(
        take(1),
        map((data) => data.tournaments ?? []),
        catchError(() => of(null)),
      ),
      archives: this.draftService.getArchiveList().pipe(
        take(1),
        catchError(() => of(null)),
      ),
    }).pipe(
      map(({ drafts, tournaments, archives }) => ({
        seasons: [
          ...(tournaments ?? []).map(toTournamentSeason),
          ...(drafts ?? []).map(toDraftSeason),
          ...(archives ?? []).map(toArchiveSeason),
        ],
        failed: drafts === null || tournaments === null || archives === null,
      })),
    );
  }

  loadDetail(season: Season): Observable<SeasonDetail> {
    const source = season.source;

    if (source.type === 'draft') {
      return forkJoin({
        matchups: this.draftService.getMatchupList(source.slug).pipe(
          take(1),
          catchError(() => of(null)),
        ),
        stats: this.draftService.getStats(source.slug).pipe(
          take(1),
          map((data) => data.pokemon ?? []),
          catchError(() => of(null)),
        ),
      }).pipe(
        map(({ matchups, stats }) => ({
          matches: (matchups ?? []).map((matchup) =>
            toDraftMatch(matchup, source.slug),
          ),
          leaders: toStatLeaders(stats ?? []),
          hasSchedule: true,
          failed: matchups === null && stats === null,
        })),
      );
    }

    if (source.type === 'tournament') {
      const base = [
        'leagues',
        source.leagueSlug,
        'tournaments',
        source.tournamentSlug,
      ];

      const slug$ = source.teamSlug
        ? of(source.teamSlug)
        : this.api.get<TournamentTeamList>([...base, 'teams']).pipe(
            take(1),
            map(
              (data) =>
                data.teams.find((team) => team.id === source.teamId)?.slug ??
                null,
            ),
            catchError(() => of(null)),
          );

      return slug$
        .pipe(
          switchMap((teamSlug) => {
            if (!teamSlug) return of(FAILED);

            return forkJoin({
              schedule: this.api
                .get<TournamentSchedule>([...base, 'schedule'], {
                  params: { teamSlug },
                })
                .pipe(
                  take(1),
                  catchError(() => of(null)),
                ),
              team: this.api
                .get<TournamentTeam>([...base, 'teams', teamSlug])
                .pipe(
                  take(1),
                  catchError(() => of(null)),
                ),
            }).pipe(
              map(({ schedule, team }) => ({
                matches: toTournamentMatches(
                  schedule?.rounds ?? [],
                  teamSlug,
                  source.leagueSlug,
                  source.tournamentSlug,
                ),
                leaders: toRosterLeaders(team?.draft ?? []),
                hasSchedule: true,
                failed: schedule === null && team === null,
              })),
            );
          }),
        );
    }

    return this.draftService.getArchiveStats(source.archiveId).pipe(
      take(1),
      map((data) => ({
        matches: [],
        leaders: toStatLeaders(data.pokemon ?? []),
        hasSchedule: false,
        failed: false,
      })),
      catchError(() => of({ ...FAILED, hasSchedule: false })),
    );
  }
}

function toDraftSeason(draft: Draft): Season {
  return {
    id: `draft.${draft.slug}`,
    kind: 'draft',
    status: draft.score && draft.score.wins + draft.score.losses > 0 ? 'active' : 'upcoming',
    name: draft.leagueName,
    teamName: draft.teamName,
    coach: draft.coach,
    format: draft.format,
    ruleset: draft.ruleset,
    record: {
      wins: draft.score?.wins ?? 0,
      losses: draft.score?.losses ?? 0,
      diff: Number(draft.score?.diff ?? 0) || 0,
    },
    unresolved: draft.unresolvedPokemon?.length ?? 0,
    nextMatch: draft.nextMatch ?? null,
    roster: draft.team ?? [],
    source: { type: 'draft', slug: draft.slug },
    homeLink: ['/', DRAFT_OVERVIEW_PATH, draft.slug],
  };
}

function toTournamentSeason(tournament: TournamentDetails): Season {
  const played =
    (tournament.score?.wins ?? 0) + (tournament.score?.losses ?? 0) > 0;

  return {
    id: `tournament.${tournament.leagueSlug}.${tournament.tournamentSlug}`,
    kind: 'tournament',
    status: played ? 'active' : 'upcoming',
    name: tournament.tournamentName,
    leagueName: tournament.leagueName,
    teamName: tournament.teamName,
    logo: tournament.logo,
    format: tournament.format,
    ruleset: tournament.ruleset,
    record: {
      wins: tournament.score?.wins ?? 0,
      losses: tournament.score?.losses ?? 0,
      diff: tournament.score?.diff ?? 0,
    },
    unresolved: 0,
    nextMatch: tournament.nextMatch ?? null,
    discord: tournament.discord,
    roster: tournament.draft ?? [],
    source: {
      type: 'tournament',
      leagueSlug: tournament.leagueSlug,
      tournamentSlug: tournament.tournamentSlug,
      teamId: tournament.teamId,
      teamSlug: tournament.teamSlug,
    },
    homeLink: [
      '/',
      LEAGUE_ZONE_PATH,
      tournament.leagueSlug,
      'tournaments',
      tournament.tournamentSlug,
    ],
  };
}

function toArchiveSeason(archive: Archive): Season {
  return {
    id: `archive.${archive._id}`,
    kind: 'draft',
    status: 'archived',
    name: archive.leagueName,
    teamName: archive.teamName,
    format: archive.format,
    ruleset: archive.ruleset,
    record: {
      wins: archive.score?.wins ?? 0,
      losses: archive.score?.losses ?? 0,
      diff: Number(archive.score?.diff ?? 0) || 0,
    },
    unresolved: 0,
    roster: archive.team ?? [],
    source: { type: 'archive', archiveId: archive._id, slug: archive.slug },
  };
}

function toDraftMatch(opponent: Opponent, slug: string): SeasonMatch {
  const matches = Array.isArray(opponent.matches) ? opponent.matches : [];

  return {
    id: opponent._id,
    stage: opponent.stage,
    teamName: opponent.teamName,
    coach: opponent.coach,
    scheduledDate: opponent.scheduledDate ?? null,
    opponentTimezone: opponent.opponentTimezone ?? null,
    score: opponent.score ?? draftScore(matches),
    roster: opponent.team ?? [],
    games: matches.map((match, index) => toDraftGame(match, index)),
    detailLink: ['/', DRAFT_OVERVIEW_PATH, slug, 'matchup', opponent._id],
    scoreLink: ['/', DRAFT_OVERVIEW_PATH, slug, 'score'],
    editLink: ['/', DRAFT_OVERVIEW_PATH, slug, 'form'],
    actionParams: { matchup: opponent._id },
    manageable: true,
  };
}

function draftScore(matches: Match[]): [number, number] | null {
  if (!matches.length) return null;

  if (matches.length > 1) {
    return matches.reduce<[number, number]>(
      (total, match) => [
        total[0] + (match.winner === 'a' ? 1 : 0),
        total[1] + (match.winner === 'b' ? 1 : 0),
      ],
      [0, 0],
    );
  }

  return [matches[0].aTeam?.score ?? 0, matches[0].bTeam?.score ?? 0];
}

function toDraftGame(match: Match, index: number): MatchGame {
  const ours = match.aTeam?.score ?? 0;
  const theirs = match.bTeam?.score ?? 0;
  const winner = match.winner ?? (ours === theirs ? null : ours > theirs ? 'a' : 'b');

  return {
    label: `Game ${index + 1}`,
    result: winner === 'a' ? 'win' : winner === 'b' ? 'loss' : 'tie',
    score: [ours, theirs],
    replay: match.replay,
  };
}

function toTournamentMatches(
  rounds: League.ScheduleRound[],
  teamSlug: string,
  leagueSlug: string,
  tournamentSlug: string,
): SeasonMatch[] {
  const matches: SeasonMatch[] = [];

  for (const round of rounds) {
    for (const stage of round.stages ?? []) {
      for (const matchup of stage.matchups ?? []) {
        const first = matchup.team1?.slug === teamSlug;
        if (!first && matchup.team2?.slug !== teamSlug) continue;
        matches.push(
          toTournamentMatch(
            matchup,
            round.name,
            first,
            leagueSlug,
            tournamentSlug,
          ),
        );
      }
    }
  }

  return matches;
}

function toTournamentMatch(
  matchup: League.Matchup,
  roundName: string,
  first: boolean,
  leagueSlug: string,
  tournamentSlug: string,
): SeasonMatch {
  const ours = first ? matchup.team1 : matchup.team2;
  const theirs = first ? matchup.team2 : matchup.team1;
  const matches = matchup.matches ?? [];
  const played = matches.length > 0 || !!matchup.winner;

  return {
    id: matchup.id,
    stage: matchup.label ? `${roundName} · ${matchup.label}` : roundName,
    teamName: theirs.name || 'TBD',
    coach: theirs.coach,
    logo: theirs.logo,
    scheduledDate: matchup.scheduledDate
      ? new Date(matchup.scheduledDate).toISOString()
      : null,
    score: played ? [ours.score ?? 0, theirs.score ?? 0] : null,
    roster: withNames(theirs.draft ?? []),
    games: matches.map((match, index) => {
      const us = first ? match.team1 : match.team2;
      const them = first ? match.team2 : match.team1;
      return {
        label: `Game ${index + 1}`,
        result: us.winner ? 'win' : them.winner ? 'loss' : 'tie',
        score: [us.score ?? 0, them.score ?? 0],
        replay: match.link,
      } satisfies MatchGame;
    }),
    detailLink: [
      '/',
      LEAGUE_ZONE_PATH,
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'matchups',
      matchup.slug,
    ],
    scoreLink: null,
    editLink: null,
    actionParams: null,
    manageable: false,
  };
}

function withNames(roster: RosterMon[]): RosterMon[] {
  return roster.map((pokemon) =>
    pokemon.name ? pokemon : { ...pokemon, name: getNameByPid(pokemon.id) },
  );
}

function toStatLeaders(stats: PokemonStat[]): RosterLeader[] {
  return stats
    .filter((stat) => stat.brought > 0 || stat.kills > 0)
    .map((stat) => ({
      pokemon: stat.pokemon,
      brought: stat.brought,
      kills: stat.kills,
      deaths: stat.deaths,
      kpg: stat.kpg ?? (stat.brought ? stat.kills / stat.brought : 0),
    }))
    .sort((a, b) => b.kills - a.kills || b.kpg - a.kpg);
}

function toRosterLeaders(roster: League.LeaguePokemon[]): RosterLeader[] {
  return roster
    .filter((pokemon) => (pokemon.record?.brought ?? 0) > 0)
    .map((pokemon) => {
      const record = pokemon.record!;
      return {
        pokemon,
        brought: record.brought,
        kills: record.kills,
        deaths: record.deaths,
        kpg: record.brought ? record.kills / record.brought : 0,
      };
    })
    .sort((a, b) => b.kills - a.kills || b.kpg - a.kpg);
}

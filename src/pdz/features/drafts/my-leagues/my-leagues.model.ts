import { DRAFT_OVERVIEW_PATH, LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { Archive } from '@pdz/features/drafts/draft-overview/archive.model';
import { Draft, SeasonFormResult } from '@pdz/features/drafts/draft.model';
import {
  TournamentDetails,
  TournamentOutcome,
  TournamentPhase,
} from '@pdz/features/league-zone/league.model';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';

export type LeagueNext = {
  round: string;
  opponent: string | null;
  when: string | null;
  link: string[];
};

export type LeagueDraft = {
  picksMade: number;
  rosterSize: number | null;
  onClock: boolean;
  round: number | null;
  pick: number | null;
  deadline: string | null;
  link: string[];
};

export type LeagueEntry = {
  id: string;
  hosted: boolean;
  teamName: string;
  logo?: string;
  league: string;
  tournament?: string;
  pokemon: Pokemon<DraftOptions>[];
  link: string[];
  phase: TournamentPhase;
  record: { wins: number; losses: number } | null;
  form: SeasonFormResult[];
  next: LeagueNext | null;
  standing: { rank: number; of: number } | null;
  draft: LeagueDraft | null;
  startsAt: string | null;
  completedAt: string | null;
  outcome: TournamentOutcome | null;
};

export type FeedKind = 'pick' | 'match' | 'draft';

export type FeedItem = {
  id: string;
  kind: FeedKind;
  icon: string;
  title: string;
  detail: string;
  when: string | null;
  action: { label: string; link: string[] };
};

const HOUR = 3600000;
const MATCH_WINDOW = 72 * HOUR;
const DRAFT_WINDOW = 7 * 24 * HOUR;

const FEED_ICON: Record<FeedKind, string> = {
  pick: 'timer',
  match: 'swords',
  draft: 'format_list_numbered',
};

function tournamentBase(tournament: TournamentDetails): string[] {
  return [
    '/',
    LEAGUE_ZONE_PATH,
    tournament.leagueSlug,
    'tournaments',
    tournament.tournamentSlug,
  ];
}

export function fromTournament(tournament: TournamentDetails): LeagueEntry {
  const base = tournamentBase(tournament);
  const draftState = tournament.draftState;
  const next = tournament.next;
  return {
    id: `hosted:${tournament.tournamentSlug}:${tournament.teamId}`,
    hosted: true,
    teamName: tournament.teamName,
    logo: getTeamLogoSrc(tournament.logo),
    league: tournament.leagueName,
    tournament: tournament.tournamentName,
    pokemon: tournament.draft,
    link: tournament.teamSlug ? [...base, 'teams', tournament.teamSlug] : base,
    phase: tournament.phase ?? 'season',
    record: tournament.score
      ? { wins: tournament.score.wins, losses: tournament.score.losses }
      : null,
    form: tournament.form ?? [],
    next: next
      ? {
          round: next.round,
          opponent: next.opponent?.name ?? null,
          when: next.when,
          link: [...base, 'matchups', next.matchupSlug],
        }
      : null,
    standing: tournament.standing ?? null,
    draft: draftState
      ? {
          picksMade: draftState.picksMade,
          rosterSize: draftState.rosterSize,
          onClock: draftState.onClock,
          round: draftState.round,
          pick: draftState.pick,
          deadline: draftState.deadline,
          link: tournament.poolSlug
            ? [...base, 'pools', tournament.poolSlug, 'draft']
            : [...base, 'draft'],
        }
      : null,
    startsAt: tournament.startsAt ?? null,
    completedAt: tournament.completedAt ?? null,
    outcome: tournament.outcome ?? null,
  };
}

export function fromDraft(draft: Draft): LeagueEntry {
  const base = ['/', DRAFT_OVERVIEW_PATH, draft.slug];
  const next = draft.next;
  return {
    id: `draft:${draft.slug}`,
    hosted: false,
    teamName: draft.teamName,
    league: draft.leagueName,
    pokemon: draft.team,
    link: base,
    phase: draft.completedAt ? 'completed' : 'season',
    record: draft.score
      ? { wins: draft.score.wins, losses: draft.score.losses }
      : null,
    form: draft.form ?? [],
    next: next
      ? {
          round: next.round,
          opponent: next.opponent.name,
          when: next.when,
          link: next.matchupId ? [...base, 'matchup', next.matchupId] : base,
        }
      : null,
    standing: null,
    draft: null,
    startsAt: null,
    completedAt: draft.completedAt ?? null,
    outcome: null,
  };
}

export function fromArchive(archive: Archive): LeagueEntry {
  return {
    id: `archive:${archive._id}`,
    hosted: false,
    teamName: archive.teamName || archive.leagueName,
    league: archive.leagueName,
    pokemon: archive.team,
    link: archive.slug
      ? ['/', DRAFT_OVERVIEW_PATH, archive.slug]
      : ['/', DRAFT_OVERVIEW_PATH, 'archives', archive._id, 'stats'],
    phase: 'completed',
    record: archive.score
      ? { wins: archive.score.wins, losses: archive.score.losses }
      : null,
    form: [],
    next: null,
    standing: null,
    draft: null,
    startsAt: null,
    completedAt: archive.completedAt ?? null,
    outcome: null,
  };
}

function within(value: string | null | undefined, window: number): boolean {
  if (!value) return false;
  const delta = new Date(value).getTime() - Date.now();
  return delta > -HOUR && delta < window;
}

export function leagueLine(entry: LeagueEntry): string {
  return entry.tournament ? `${entry.league} · ${entry.tournament}` : entry.league;
}

export function feedFrom(entries: LeagueEntry[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const entry of entries) {
    if (entry.phase === 'completed') continue;
    const where = `${entry.teamName} · ${leagueLine(entry)}`;
    if (entry.draft?.onClock) {
      const slot =
        entry.draft.round && entry.draft.pick
          ? ` · Round ${entry.draft.round}, Pick ${entry.draft.pick}`
          : '';
      items.push({
        id: `${entry.id}:pick`,
        kind: 'pick',
        icon: FEED_ICON.pick,
        title: "You're on the Clock",
        detail: `${where}${slot}`,
        when: entry.draft.deadline,
        action: { label: 'Make Your Pick', link: entry.draft.link },
      });
    }
    if (entry.next && within(entry.next.when, MATCH_WINDOW)) {
      items.push({
        id: `${entry.id}:match`,
        kind: 'match',
        icon: FEED_ICON.match,
        title: entry.next.opponent
          ? `${entry.next.round} vs ${entry.next.opponent}`
          : entry.next.round,
        detail: where,
        when: entry.next.when,
        action: { label: 'Prep Matchup', link: entry.next.link },
      });
    }
    if (entry.phase === 'upcoming' && within(entry.startsAt, DRAFT_WINDOW)) {
      items.push({
        id: `${entry.id}:draft`,
        kind: 'draft',
        icon: FEED_ICON.draft,
        title: 'Draft starts soon',
        detail: where,
        when: entry.startsAt,
        action: { label: 'View League', link: entry.link },
      });
    }
  }
  return items.sort((a, b) => {
    if (a.kind === 'pick' || b.kind === 'pick')
      return Number(b.kind === 'pick') - Number(a.kind === 'pick');
    return time(a.when) - time(b.when);
  });
}

export function time(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}

const PHASE_ORDER: Record<TournamentPhase, number> = {
  drafting: 0,
  season: 1,
  upcoming: 2,
  completed: 3,
};

export function activeOrder(a: LeagueEntry, b: LeagueEntry): number {
  return (
    PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] ||
    Number(!!b.draft?.onClock) - Number(!!a.draft?.onClock) ||
    time(a.next?.when ?? a.startsAt) - time(b.next?.when ?? b.startsAt)
  );
}

export function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  return `${value}${['th', 'st', 'nd', 'rd'][value % 10] ?? 'th'}`;
}

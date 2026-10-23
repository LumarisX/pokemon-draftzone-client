import { TOURNAMENT_LOG_PATH } from '@pdz/core/route-paths';
import { League } from '../league.interface';

export type TournamentLink = {
  id: string;
  label: string;
  route: string[];
  icon: string;
  description: string;
  exact?: boolean;
  status?: string;
};

export type TournamentLinkGroup = {
  id: string;
  label: string;
  links: TournamentLink[];
};

export type TournamentLinkContext = {
  base: string[];
  profile: League.CoachProfile | null;
  draftStatus: string | null;
  canManage: boolean;
  pools: { poolSlug: string }[];
};

export function myTeamRoute(
  base: string[],
  profile: League.CoachProfile | null,
): string[] | null {
  if (!base.length || !profile?.pool || !profile.teamSlug) return null;
  return [...base, 'teams', profile.teamSlug];
}

function draftsRoute(base: string[], pools: { poolSlug: string }[]): string[] {
  return pools.length === 1
    ? [...base, 'pools', pools[0].poolSlug, 'draft']
    : [...base, 'pools'];
}

export function tournamentLinkGroups(
  context: TournamentLinkContext,
): TournamentLinkGroup[] {
  const { base } = context;
  if (!base.length) return [];

  const groups: TournamentLinkGroup[] = [];

  groups.push(
    {
      id: 'tournament',
      label: 'Tournament',
      links: [
        {
          id: 'drafts',
          label: 'Draft Pools',
          route: draftsRoute(base, context.pools),
          icon: 'pokeball',
          description: 'Every pool’s draft, live progress and picks',
          ...(context.draftStatus ? { status: context.draftStatus } : {}),
        },
        {
          id: 'standings',
          label: 'Standings',
          route: [...base, 'standings'],
          icon: 'leaderboard',
          description: 'Records, differentials and placement',
        },
        {
          id: 'teams',
          label: 'Teams',
          route: [...base, 'teams'],
          icon: 'groups',
          description: 'Every roster in the tournament',
          exact: true,
        },
        {
          id: 'schedule',
          label: 'Schedule',
          route: [...base, 'schedule'],
          icon: 'calendar_month',
          description: 'Rounds, matchups and deadlines',
        },
        {
          id: 'trades',
          label: 'Trades',
          route: [...base, 'trades'],
          icon: 'swap_horiz',
          description: 'Proposed and completed trades',
        },
      ],
    },
    {
      id: 'reference',
      label: 'Reference',
      links: [
        {
          id: 'rules',
          label: 'Rules',
          route: [...base, 'rules'],
          icon: 'menu_book',
          description: 'Tournament rules and regulations',
        },
        {
          id: 'tier-list',
          label: 'Tier List',
          route: [...base, 'tier-list'],
          icon: 'format_list_numbered',
          description: 'Pokémon tiers and costs',
        },
        {
          id: 'log',
          label: 'Log',
          route: [...base, TOURNAMENT_LOG_PATH],
          icon: 'history',
          description: 'Every change organizers made, for anyone to check',
        },
      ],
    },
  );

  if (context.canManage) groups.push(manageLinkGroup(base, context.pools));

  return groups;
}

export function manageLinkGroup(
  base: string[],
  pools: { poolSlug: string }[],
): TournamentLinkGroup {
  const manage = [...base, 'manage'];
  const links: TournamentLink[] = [
    {
      id: 'manage-overview',
      label: 'Overview',
      route: manage,
      icon: 'dashboard',
      description: 'Where the tournament stands and what needs you',
      exact: true,
    },
    {
      id: 'manage-signups',
      label: 'Sign-Ups',
      route: [...manage, 'sign-ups'],
      icon: 'how_to_reg',
      description: 'Review applicants and place them in pools',
    },
  ];

  if (pools.length) {
    links.push({
      id: 'manage-draft',
      label: 'Draft Control',
      route: [...manage, 'pools', pools[0].poolSlug, 'draft'],
      icon: 'sports_esports',
      description: 'Start, pause and fix picks in a live draft',
    });
  }

  links.push(
    {
      id: 'manage-schedule',
      label: 'Schedule',
      route: [...manage, 'schedule'],
      icon: 'calendar_month',
      description: 'Stages, rounds, matchups and which round is live',
    },
    {
      id: 'manage-results',
      label: 'Results',
      route: [...manage, 'results'],
      icon: 'scoreboard',
      description: 'Record scores and review reports',
    },
    {
      id: 'manage-trades',
      label: 'Trades',
      route: [...manage, 'trades'],
      icon: 'swap_horiz',
      description: 'Approve and reverse trades',
    },
    {
      id: 'manage-settings',
      label: 'Settings',
      route: [...manage, 'settings'],
      icon: 'settings',
      description: 'How the tournament works, from sign-ups to scoring',
    },
  );

  return { id: 'manage', label: 'Manage', links };
}


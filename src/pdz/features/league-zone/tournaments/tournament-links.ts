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
};

export function tournamentLinkGroups(
  context: TournamentLinkContext,
): TournamentLinkGroup[] {
  const { base } = context;
  if (!base.length) return [];

  const groups: TournamentLinkGroup[] = [];
  const team = teamGroup(context);
  if (team) groups.push(team);

  groups.push(
    {
      id: 'tournament',
      label: 'Tournament',
      links: [
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
      ],
    },
  );

  if (context.canManage) groups.push(...manageLinkGroups(base));

  return groups;
}

export function manageLinkGroups(base: string[]): TournamentLinkGroup[] {
  if (!base.length) return [];
  const manage = [...base, 'manage'];

  return [
    {
      id: 'manage',
      label: 'Manage',
      links: [
        {
          id: 'manage-hub',
          label: 'Dashboard',
          route: manage,
          icon: 'dashboard',
          description: 'Settings, setup checklist and everything else',
          exact: true,
        },
        {
          id: 'manage-matches',
          label: 'Schedule',
          route: [...manage, 'schedule'],
          icon: 'emoji_events',
          description: 'Stages, rounds, matchups & which round is live',
        },
        {
          id: 'manage-results',
          label: 'Results',
          route: [...manage, 'results'],
          icon: 'scoreboard',
          description: 'Record scores & review reports',
        },
        {
          id: 'manage-signups',
          label: 'Sign-Ups',
          route: [...manage, 'sign-ups'],
          icon: 'people',
          description: 'Registrations, review & pool assignment',
        },
        {
          id: 'manage-trades',
          label: 'Trades',
          route: [...manage, 'trades'],
          icon: 'swap_horiz',
          description: 'Approve and reverse trades',
        },
      ],
    },
    {
      id: 'setup',
      label: 'Setup',
      links: [
        {
          id: 'manage-organizers',
          label: 'Organizers',
          route: [...manage, 'organizers'],
          icon: 'shield_person',
          description: 'Who can manage this tournament',
        },
        {
          id: 'manage-rules',
          label: 'Rules',
          route: [...manage, 'rules'],
          icon: 'menu_book',
          description: 'Edit rules & regulations',
        },
        {
          id: 'manage-tier-list',
          label: 'Tier List',
          route: [...base, 'tier-list', 'edit'],
          icon: 'format_list_numbered',
          description: 'Edit Pokémon tiers & costs',
        },
      ],
    },
  ];
}

export function manageDashboardGroups(base: string[]): TournamentLinkGroup[] {
  if (!base.length) return [];
  const manage = [...base, 'manage'];

  return [
    {
      id: 'run',
      label: 'Run',
      links: [
        {
          id: 'manage-matches',
          label: 'Schedule',
          route: [...manage, 'schedule'],
          icon: 'emoji_events',
          description: 'Stages, rounds, matchups & which round is live',
        },
        {
          id: 'manage-results',
          label: 'Results',
          route: [...manage, 'results'],
          icon: 'scoreboard',
          description: 'Record scores & review reports',
        },
        {
          id: 'manage-trades',
          label: 'Trades',
          route: [...manage, 'trades'],
          icon: 'swap_horiz',
          description: 'Approve and reverse trades',
        },
      ],
    },
  ];
}

export function manageAccessLink(base: string[]): TournamentLink | null {
  if (!base.length) return null;
  return {
    id: 'manage-organizers',
    label: 'Organizers',
    route: [...base, 'manage', 'organizers'],
    icon: 'shield_person',
    description: 'Who can manage this tournament',
  };
}

function teamGroup(
  context: TournamentLinkContext,
): TournamentLinkGroup | null {
  const { base, profile, draftStatus } = context;
  if (!profile?.pool || !profile.teamSlug) return null;

  return {
    id: 'team',
    label: profile.teamName || 'Your Team',
    links: [
      {
        id: 'team-overview',
        label: 'Overview',
        route: [...base, 'teams', profile.teamSlug],
        icon: 'shield',
        description: 'Your roster and record',
      },
      {
        id: 'team-draft',
        label: 'Draft',
        route: [...base, 'pools', profile.pool.poolSlug, 'draft'],
        icon: 'sports_esports',
        description: 'Make your picks',
        ...(draftStatus ? { status: draftStatus } : {}),
      },
    ],
  };
}

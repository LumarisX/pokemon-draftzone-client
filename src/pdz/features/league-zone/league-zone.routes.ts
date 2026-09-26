import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import {
  DRAFT_OVERVIEW_PATH,
  LEAGUE_ZONE_MANAGE_PATH,
  ORGANIZER_INVITE_PATH,
} from '@pdz/core/route-paths';
import { MatchupOverviewComponent } from '../drafts/matchup-overview/matchup-overview.component';
import { LEAGUE_MATCHUP_PAGE } from '../drafts/matchup-overview/matchup-page.config';
import { TierListFormComponent } from '../tier-lists/tier-list/tier-list-form/tier-list-form.component';
import { unsavedChangesGuard } from '../tier-lists/tier-list/tier-list-form/unsaved-changes.guard';
import { TierListComponent } from '../tier-lists/tier-list/tier-list.component';
import { PoolDashboardComponent } from './pools/pool-dashboard/pool-dashboard.component';
import { PowerRankingsComponent } from './pools/power-rankings/power-rankings.component';
import { LeagueBracketComponent } from './league-bracket/league-bracket.component';
import { LeagueDraftComponent } from './league-drafting/league-drafting.component';
import { LeagueLandingComponent } from './league-landing/league-landing.component';
import { LeagueMatchupComponent } from './league-matchup/league-matchup.component';
import { leagueRoleGuard } from './league-role.guard';
import { LeagueRulesOverviewComponent } from './league-rules-overview/league-rules-overview.component';
import { LeagueSignUpComponent } from './league-sign-up/league-sign-up.component';
import { LeagueStandingsComponent } from './league-standings/league-standings.component';
import { LeagueTeamComponent } from './league-team/league-team.component';
import { LeagueTeamsComponent } from './league-teams/league-teams.component';
import { LeagueTradesComponent } from './league-trades/league-trades.component';
import { OrganizerInviteComponent } from './organizer-invite/organizer-invite.component';
import { TournamentDraftComponent } from './tournaments/tournament-draft/tournament-draft.component';
import { TournamentPoolsComponent } from './tournaments/tournament-pools/tournament-pools.component';
import { TournamentLandingComponent } from './tournaments/tournament-landing/tournament-landing.component';
import { TournamentLayoutComponent } from './tournaments/tournament-layout/tournament-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: `/${DRAFT_OVERVIEW_PATH}`,
    pathMatch: 'full',
  },
  {
    path: `:leagueSlug`,
    component: LeagueLandingComponent,
  },
  {
    path: `:leagueSlug/tournaments/:tournamentSlug/${ORGANIZER_INVITE_PATH}`,
    component: OrganizerInviteComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':leagueSlug/tournaments/:tournamentSlug',
    component: TournamentLayoutComponent,
    children: [
      {
        path: '',
        component: TournamentLandingComponent,
      },
      {
        path: LEAGUE_ZONE_MANAGE_PATH,
        loadChildren: () =>
          import('./league-manage/league-manage.routes').then((m) => m.routes),
        canActivate: [leagueRoleGuard],
        data: { role: 'organizer' },
      },
      {
        path: 'rules',
        component: LeagueRulesOverviewComponent,
      },
      {
        path: 'tier-list',
        component: TierListComponent,
      },
      {
        path: 'tier-list/edit',
        component: TierListFormComponent,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'teams',
        component: LeagueTeamsComponent,
      },
      {
        path: 'teams/:teamSlug',
        component: LeagueTeamComponent,
      },
      {
        path: 'sign-up',
        component: LeagueSignUpComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'schedule',
        component: LeagueBracketComponent,
      },
      {
        path: 'trades',
        component: LeagueTradesComponent,
      },
      {
        path: 'draft',
        component: TournamentDraftComponent,
      },
      {
        path: 'pools',
        component: TournamentPoolsComponent,
      },
      {
        path: 'pools/:poolSlug',
        component: PoolDashboardComponent,
      },
      {
        path: 'matchups/:matchupSlug',
        component: LeagueMatchupComponent,
      },
      {
        path: 'matchups/:matchupSlug/breakdown',
        component: MatchupOverviewComponent,
        data: { matchup: LEAGUE_MATCHUP_PAGE },
      },
      {
        path: 'standings',
        component: LeagueStandingsComponent,
      },
      {
        path: 'pools/:poolSlug/draft',
        component: LeagueDraftComponent,
      },
      {
        path: 'pools/:poolSlug/power-rankings',
        component: PowerRankingsComponent,
      },
      {
        path: 'pools/:poolSlug/tier-list',
        component: TierListComponent,
      },
      {
        path: 'drafts',
        redirectTo: 'pools',
        pathMatch: 'full',
      },
      {
        path: 'drafts/:poolSlug',
        redirectTo: 'pools/:poolSlug',
        pathMatch: 'full',
      },
      {
        path: 'drafts/:poolSlug/draft',
        redirectTo: 'pools/:poolSlug/draft',
      },
      {
        path: 'drafts/:poolSlug/power-rankings',
        redirectTo: 'pools/:poolSlug/power-rankings',
      },
      {
        path: 'drafts/:poolSlug/tier-list',
        redirectTo: 'pools/:poolSlug/tier-list',
      },
      {
        path: 'drafts/:poolSlug/teams',
        redirectTo: 'teams',
        pathMatch: 'full',
      },
      {
        path: 'drafts/:poolSlug/teams/:teamSlug',
        redirectTo: 'teams/:teamSlug',
        pathMatch: 'full',
      },
      {
        path: 'stages/:stageSlug/trades',
        component: LeagueTradesComponent,
      },
    ],
  },
];

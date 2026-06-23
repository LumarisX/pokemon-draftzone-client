import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { LEAGUE_ZONE_MANAGE_PATH } from '@pdz/core/route-paths';
import { MatchupOverviewComponent } from '../drafts/matchup-overview/matchup-overview.component';
import { TierListFormComponent } from '../tier-lists/tier-list/tier-list-form/tier-list-form.component';
import { unsavedChangesGuard } from '../tier-lists/tier-list/tier-list-form/unsaved-changes.guard';
import { TierListComponent } from '../tier-lists/tier-list/tier-list.component';
import { DivisionDashboardComponent } from './divisions/division-dashboard/division-dashboard.component';
import { PowerRankingsComponent } from './divisions/power-rankings/power-rankings.component';
import { LeagueBracketComponent } from './league-bracket/league-bracket.component';
import { LeagueCoachComponent } from './league-coach/league-coach.component';
import { LeagueDraftComponent } from './league-drafting/league-drafting.component';
import { LeagueLandingComponent } from './league-landing/league-landing.component';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { leagueRoleGuard } from './league-role.guard';
import { LeagueRulesOverviewComponent } from './league-rules-overview/league-rules-overview.component';
import { LeagueScheduleComponent } from './league-schedule/league-schedule.component';
import { LeagueSignUpComponent } from './league-sign-up/league-sign-up.component';
import { LeagueStandingsComponent } from './league-standings/league-standings.component';
import { LeagueTeamComponent } from './league-team/league-team.component';
import { LeagueTeamsComponent } from './league-teams/league-teams.component';
import { LeagueTradesComponent } from './league-trades/league-trades.component';
import { TournamentLandingComponent } from './tournaments/tournament-landing/tournament-landing.component';

export const routes: Routes = [
  {
    path: '',
    component: LeagueOverviewComponent,
  },
  {
    path: `:leagueKey`,
    component: LeagueLandingComponent,
  },
  {
    path: `:leagueKey/tournaments/:tournamentKey/${LEAGUE_ZONE_MANAGE_PATH}`,
    loadChildren: () =>
      import('./league-manage/league-manage.routes').then((m) => m.routes),
    canActivate: [leagueRoleGuard],
    data: { role: 'organizer' },
  },
  // {
  //   path: 'new',
  //   component: LeagueNewComponent,
  // },
  {
    path: ':leagueKey/tournaments/:tournamentKey',
    component: TournamentLandingComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/teams/:teamKey',
    component: LeagueTeamComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/rules',
    component: LeagueRulesOverviewComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/tier-list',
    component: TierListComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/tier-list/edit',
    component: TierListFormComponent,
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/sign-up',
    component: LeagueSignUpComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/coach',
    component: LeagueCoachComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/bracket',
    component: LeagueBracketComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/playoffs/schedule',
    component: LeagueBracketComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/trades',
    component: LeagueTradesComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/drafts/:draftKey',
    component: DivisionDashboardComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/stages/:stageId/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/stages/:stageId/schedule/matchups/:matchupId',
    component: MatchupOverviewComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/stages/:stageId/standings',
    component: LeagueStandingsComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/drafts/:draftKey/draft',
    component: LeagueDraftComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/drafts/:draftKey/power-rankings',
    component: PowerRankingsComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/drafts/:draftKey/teams',
    component: LeagueTeamsComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/drafts/:draftKey/teams/:teamKey',
    component: LeagueTeamComponent,
  },

  {
    path: ':leagueKey/tournaments/:tournamentKey/drafts/:draftKey/tier-list',
    component: TierListComponent,
  },
  {
    path: ':leagueKey/tournaments/:tournamentKey/stages/:stageId/trades',
    component: LeagueTradesComponent,
  },
  // {
  //   path: 'view/:tournamentId/auction',
  //   component: LeagueAuctionComponent,
  //   canActivate: [leagueRoleGuard],
  //   data: { role: 'coach' },
  // },
];

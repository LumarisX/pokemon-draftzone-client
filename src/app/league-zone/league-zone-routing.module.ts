import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueDraftComponent } from './league-drafting/league-drafting.component';
import { LeagueLandingComponent } from './league-landing/landing.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { LeagueSignUpComponent } from './league-sign-up/league-sign-up.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { leagueRoleGuard } from './league-role.guard';
import { LeagueTierListComponent } from './league-tier-list/league-tier-list.component';
import { PowerRankingsComponent } from './divisions/power-rankings/power-rankings.component';
import { LeagueBracketComponent } from './league-bracket/league-bracket.component';
import { LeagueDashboardComponent } from './league/league.component';
import { LeagueScheduleComponent } from './league-schedule/league-schedule.component';
import { LeagueStandingsComponent } from './league-standings/league-standings.component';
import { LeagueTradesComponent } from './league-trades/league-trades.component';
import { LeagueTeamsComponent } from './league-teams/league-teams.component';
import { LeagueRulesOverviewComponent } from './league-rules-overview/league-rules-overview.component';
import { LeagueTeamComponent } from './league-team/league-team.component';
import { LeagueNewComponent } from './league-new/league-new.component';

export const LeagueZonePath = 'leagues';
const routes: Routes = [
  {
    path: '',
    component: LeagueOverviewComponent,
  },
  {
    path: `:leagueKey/${LeagueManagePath}`,
    loadChildren: () =>
      import('./league-manage/league-manage.module').then(
        (m) => m.LeagueManageModule,
      ),
    canActivate: [leagueRoleGuard],
    data: { role: 'organizer' },
  },
  {
    path: 'new',
    component: LeagueNewComponent,
  },
  {
    path: ':leagueKey',
    component: LeagueLandingComponent,
  },
  {
    path: ':leagueKey/dashboard',
    component: LeagueDashboardComponent,
  },

  {
    path: ':leagueKey/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: ':leagueKey/rules',
    component: LeagueRulesOverviewComponent,
  },
  {
    path: ':leagueKey/tier-list',
    component: LeagueTierListComponent,
  },

  {
    path: ':leagueKey/sign-up',
    component: LeagueSignUpComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':leagueKey/bracket',
    component: LeagueBracketComponent,
  },
  {
    path: ':leagueKey/trades',
    component: LeagueTradesComponent,
  },
  {
    path: ':leagueKey/:divisionKey/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: ':leagueKey/:divisionKey/standings',
    component: LeagueStandingsComponent,
  },
  {
    path: ':leagueKey/:divisionKey/draft',
    component: LeagueDraftComponent,
  },
  {
    path: ':leagueKey/:divisionKey/teams',
    component: LeagueTeamsComponent,
  },
  {
    path: ':leagueKey/:divisionKey/power-rankings',
    component: PowerRankingsComponent,
  },
  {
    path: ':leagueKey/:divisionKey/team/:teamId',
    component: LeagueTeamComponent,
  },
  // {
  //   path: 'view/:leagueId/auction',
  //   component: LeagueAuctionComponent,
  //   canActivate: [leagueRoleGuard],
  //   data: { role: 'coach' },
  // },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueZoneRoutingModule {}

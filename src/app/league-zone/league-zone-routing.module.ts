import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueRulesComponent } from './league-rules-overview/league-rules-old/rules.component';
import { LeagueDraftComponent } from './league-drafting/league-drafting.component';
import { LeagueLandingComponent } from './league-landing/landing.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { LeagueSignUpComponent } from './league-sign-up/league-sign-up.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { leagueRoleGuard } from './league-role.guard';
import { LeagueTierListComponent } from './league-tier-list/league-tier-list.component';

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
  // {
  //   path: 'new',
  //   component: LeagueNewComponent,
  // },
  {
    path: ':leagueKey',
    component: LeagueLandingComponent,
  },
  //   {
  //   path: ':leagueKey/dashboard',
  //   component: LeagueDashboardComponent,
  // },
  // {
  //   path: ':leagueKey/standings',
  //   component: LeagueStandingsComponent,
  // },
  // {
  //   path: 'view/:leagueKey/schedule',
  //   component: LeagueScheduleComponent,
  // },
  {
    path: ':leagueKey/rules',
    component: LeagueRulesComponent,
  },
  {
    path: ':leagueKey/tier-list',
    component: LeagueTierListComponent,
  },
  {
    path: ':leagueKey/:divisionKey/draft',
    component: LeagueDraftComponent,
  },
  {
    path: ':leagueKey/sign-up',
    component: LeagueSignUpComponent,
    canActivate: [AuthGuard],
  },
  // {
  //   path: 'view/:leagueKey/bracket',
  //   component: LeagueBracketComponent,
  // },
  // {
  //   path: 'view/:leagueKey/trades',
  //   component: LeagueTradesComponent,
  // },

  // {
  //   path: 'view/:leagueKey/teams',
  //   component: LeagueTeamsComponent,
  // },
  // {
  //   path: 'view/:leagueKey/team/:teamid',
  //   component: LeagueTeamComponent,
  // },
  // {
  //   path: 'view/:leagueKey/auction',
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

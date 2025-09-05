import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BZRulesComponent } from './league-rules-overview/league-rules-old/rules.component';
import { LeagueDraftingComponent } from './league-drafting/league-drafting.component';
import { LeagueLandingComponent } from './league-landing/landing.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { LeagueSignUpComponent } from './league-sign-up/league-sign-up.component';
import { BZTierListComponent } from './league-tier-list/league-tier-old/tier-list.component';

export const LeagueZonePath = 'leagues';
const routes: Routes = [
  {
    path: '',
    component: LeagueOverviewComponent,
  },
  {
    path: LeagueManagePath,
    loadChildren: () =>
      import('./league-manage/league-manage.module').then(
        (m) => m.LeagueManageModule,
      ),
  },
  // {
  //   path: 'new',
  //   component: LeagueNewComponent,
  // },
  {
    path: ':leagueId',
    component: LeagueLandingComponent,
  },
  //   {
  //   path: ':leagueId/dashboard',
  //   component: LeagueDashboardComponent,
  // },
  // {
  //   path: ':leagueId/standings',
  //   component: LeagueStandingsComponent,
  // },
  // {
  //   path: 'view/:leagueId/schedule',
  //   component: LeagueScheduleComponent,
  // },
  {
    path: ':leagueId/rules',
    component: BZRulesComponent,
  },
  {
    path: ':leagueId/tier-list',
    component: BZTierListComponent,
  },
  {
    path: ':leagueId/drafting',
    component: LeagueDraftingComponent,
  },
  {
    path: ':leagueId/sign-up',
    component: LeagueSignUpComponent,
  },
  // {
  //   path: 'view/:leagueId/bracket',
  //   component: LeagueBracketComponent,
  // },
  // {
  //   path: 'view/:leagueId/trades',
  //   component: LeagueTradesComponent,
  // },

  // {
  //   path: 'view/:leagueId/teams',
  //   component: LeagueTeamsComponent,
  // },
  // {
  //   path: 'view/:leagueId/team/:teamid',
  //   component: LeagueTeamComponent,
  // },
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

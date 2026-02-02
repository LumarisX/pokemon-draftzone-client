import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueDraftComponent } from './league-drafting/league-drafting.component';
import { LeagueLandingComponent } from './league-landing/league-landing.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { LeagueSignUpComponent } from './league-sign-up/league-sign-up.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { leagueRoleGuard } from './league-role.guard';
import { LeagueTierListComponent } from './league-tier-list/league-tier-list.component';
import { PowerRankingsComponent } from './divisions/power-rankings/power-rankings.component';
import { LeagueBracketComponent } from './league-bracket/league-bracket.component';
import { LeagueDashboardComponent } from './divisions/division-landing/division-dashboard.component';
import { LeagueScheduleComponent } from './league-schedule/league-schedule.component';
import { LeagueStandingsComponent } from './league-standings/league-standings.component';
import { LeagueTradesComponent } from './league-trades/league-trades.component';
import { LeagueTeamsComponent } from './league-teams/league-teams.component';
import { LeagueRulesOverviewComponent } from './league-rules-overview/league-rules-overview.component';
import { LeagueTeamComponent } from './league-team/league-team.component';
import { LeagueNewComponent } from './league-new/league-new.component';
import { LeagueTierListFormComponent } from './league-tier-list/league-tier-list-form/league-tier-list-form.component';

export const LeagueZonePath = 'leagues';
const routes: Routes = [
  {
    path: '',
    component: LeagueOverviewComponent,
  },
  {
    path: `:tournamentKey/${LeagueManagePath}`,
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
    path: ':tournamentKey',
    component: LeagueLandingComponent,
  },
  {
    path: ':tournamentKey/rules',
    component: LeagueRulesOverviewComponent,
  },
  {
    path: ':tournamentKey/tier-list',
    component: LeagueTierListComponent,
  },
  {
    path: ':tournamentKey/tier-list/edit',
    component: LeagueTierListFormComponent,
  },
  {
    path: ':tournamentKey/sign-up',
    component: LeagueSignUpComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':tournamentKey/bracket',
    component: LeagueBracketComponent,
  },
  {
    path: ':tournamentKey/trades',
    component: LeagueTradesComponent,
  },
  {
    path: ':tournamentKey/:divisionKey',
    component: LeagueDashboardComponent,
  },
  {
    path: ':tournamentKey/:divisionKey/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: ':tournamentKey/:divisionKey/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: ':tournamentKey/:divisionKey/standings',
    component: LeagueStandingsComponent,
  },
  {
    path: ':tournamentKey/:divisionKey/draft',
    component: LeagueDraftComponent,
  },
  {
    path: ':tournamentKey/:divisionKey/teams',
    component: LeagueTeamsComponent,
  },
  {
    path: ':tournamentKey/:divisionKey/power-rankings',
    component: PowerRankingsComponent,
  },
  {
    path: ':tournamentKey/:divisionKey/team/:teamId',
    component: LeagueTeamComponent,
  },
  // {
  //   path: 'view/:tournamentId/auction',
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

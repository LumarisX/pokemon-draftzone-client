import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { DivisionDashboardComponent } from './divisions/division-dashboard/division-dashboard.component';
import { PowerRankingsComponent } from './divisions/power-rankings/power-rankings.component';
import { LeagueBracketComponent } from './league-bracket/league-bracket.component';
import { LeagueDraftComponent } from './league-drafting/league-drafting.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';
import { LeagueNewComponent } from './league-new/league-new.component';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { leagueRoleGuard } from './league-role.guard';
import { LeagueRulesOverviewComponent } from './league-rules-overview/league-rules-overview.component';
import { LeagueScheduleComponent } from './league-schedule/league-schedule.component';
import { LeagueSignUpComponent } from './league-sign-up/league-sign-up.component';
import { LeagueStandingsComponent } from './league-standings/league-standings.component';
import { LeagueTeamComponent } from './league-team/league-team.component';
import { LeagueTeamsComponent } from './league-teams/league-teams.component';
import { LeagueTierListFormComponent } from './league-tier-list/league-tier-list-form/league-tier-list-form.component';
import { LeagueTierListComponent } from './league-tier-list/league-tier-list.component';
import { LeagueTradesComponent } from './league-trades/league-trades.component';
import { TournamentLandingComponent } from './tournaments/tournament-landing/tournament-landing.component';

export const LeagueZonePath = 'leagues';
const routes: Routes = [
  {
    path: '',
    component: LeagueOverviewComponent,
  },
  {
    path: `pdbl/tournaments/:tournamentKey/${LeagueManagePath}`,
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
    path: 'pdbl/tournaments/:tournamentKey',
    component: TournamentLandingComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/rules',
    component: LeagueRulesOverviewComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/tier-list',
    component: LeagueTierListComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/tier-list/edit',
    component: LeagueTierListFormComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/sign-up',
    component: LeagueSignUpComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/bracket',
    component: LeagueBracketComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/trades',
    component: LeagueTradesComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey',
    component: DivisionDashboardComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey/standings',
    component: LeagueStandingsComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey/draft',
    component: LeagueDraftComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey/teams',
    component: LeagueTeamsComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey/power-rankings',
    component: PowerRankingsComponent,
  },
  {
    path: 'pdbl/tournaments/:tournamentKey/divisions/:divisionKey/teams/:teamId',
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

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueBracketComponent } from './league-bracket/league-bracket.component';
import { LeagueDraftingComponent } from './league-drafting/league-drafting.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { LeagueScheduleComponent } from './league-schedule/league-schedule.component';
import { LeagueStandingsComponent } from './league-standings/league-standings.component';
import { LeagueTeamComponent } from './league-team/league-team.component';
import { LeagueTeamsComponent } from './league-teams/league-teams.component';
import { LeagueTradesComponent } from './league-trades/league-trades.component';
import { LeagueComponent } from './league/league.component';
import { LeagueNewComponent } from './league-new/league-new.component';
import { LeagueRulesOverviewComponent } from './league-rules-overview/league-rules-overview.component';

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
  {
    path: 'new',
    component: LeagueNewComponent,
  },
  {
    path: 'view/:leagueId',
    component: LeagueComponent,
  },
  {
    path: 'view/:leagueId/standings',
    component: LeagueStandingsComponent,
  },
  {
    path: 'view/:leagueId/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: 'view/:leagueId/drafting',
    component: LeagueDraftingComponent,
  },
  {
    path: 'view/:leagueId/bracket',
    component: LeagueBracketComponent,
  },
  {
    path: 'view/:leagueId/trades',
    component: LeagueTradesComponent,
  },
  {
    path: 'view/:leagueId/rules',
    component: LeagueRulesOverviewComponent,
  },
  {
    path: 'view/:leagueId/teams',
    component: LeagueTeamsComponent,
  },
  {
    path: 'view/:leagueId/team/:teamid',
    component: LeagueTeamComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueZoneRoutingModule {}

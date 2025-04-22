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
import { LeagueTierListFormComponent } from './league-tier-list/league-tier-list-form/league-tier-list-form.component';
import { LeagueTradesComponent } from './league-trades/league-trades.component';
import { LeagueComponent } from './league/league.component';

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
    path: 'view/leagueidplaceholder',
    component: LeagueComponent,
  },
  {
    path: 'view/leagueidplaceholder/standings',
    component: LeagueStandingsComponent,
  },
  {
    path: 'view/leagueidplaceholder/schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: 'view/leagueidplaceholder/drafting',
    component: LeagueDraftingComponent,
  },
  {
    path: 'view/leagueidplaceholder/bracket',
    component: LeagueBracketComponent,
  },
  {
    path: 'edit/leagueidplaceholder/tier',
    component: LeagueTierListFormComponent,
  },
  {
    path: 'view/leagueidplaceholder/trades',
    component: LeagueTradesComponent,
  },
  {
    path: 'view/leagueidplaceholder/teams',
    component: LeagueTeamsComponent,
  },
  {
    path: 'view/leagueidplaceholder/team/:teamid',
    component: LeagueTeamComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueZoneRoutingModule {}

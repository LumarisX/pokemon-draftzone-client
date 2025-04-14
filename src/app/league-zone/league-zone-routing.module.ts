import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';
import { LeagueComponent } from './league/league.component';
import { LeagueTierListFormComponent } from './league-tier-list/league-tier-list-form/league-tier-list-form.component';
import { LeagueStandingsComponent } from './league-standings/league-standings.component';
import { LeagueScheduleMatchupComponent } from './league-schedule-matchup/league-schedule-matchup.component';
import { LeagueBracketComponent } from './league-bracket/league-bracket.component';
import { LeagueDraftingComponent } from './league-drafting/league-drafting.component';

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
    component: LeagueScheduleMatchupComponent,
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
    path: 'view/leagueidplaceholder/tier/edit',
    component: LeagueTierListFormComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueZoneRoutingModule {}

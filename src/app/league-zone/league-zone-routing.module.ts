import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueOverviewComponent } from './league-overview/league-overview.component';
import { LeagueManageComponent } from './league-manage/league-manage.component';
import { LeagueManagePath } from './league-manage/league-manage-routing.module';

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
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueZoneRoutingModule {}

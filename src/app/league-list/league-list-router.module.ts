import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueFormComponent } from './form/league-form.component';
import { LeagueAdListComponent } from './league-list.component';
import { LeagueManageComponent } from './manage/league-manage.component';
import { AuthGuard } from '@auth0/auth0-angular';
const routes: Routes = [
  {
    path: 'league-list',
    component: LeagueAdListComponent,
  },
  {
    path: 'league-list/manage',
    component: LeagueManageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'league-list/manage/new',
    component: LeagueFormComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueAdRoutingModule {}

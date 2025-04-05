import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueManageComponent } from './league-manage.component';
import { LeagueFormNewComponent } from '../league-form/league-form-new/league-form-new.component';
import { LeagueFormEditComponent } from '../league-form/league-form-edit/league-form-edit.component';

export const LeagueManagePath = 'manage';

const routes: Routes = [
  {
    path: '',
    component: LeagueManageComponent,
  },
  {
    path: 'new',
    component: LeagueFormNewComponent,
  },
  {
    path: 'edit',
    component: LeagueFormEditComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueManageRoutingModule {}

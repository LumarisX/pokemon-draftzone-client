import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueTierListFormComponent } from '../league-tier-list/league-tier-list-form/league-tier-list-form.component';
import { LeagueManageComponent } from './league-manage.component';
import { LeagueSettingsComponent } from './league-settings/league-settings.component';
import { LeagueManageSignupsComponent } from './league-manage-signups/league-manage-signups.component';

export const LeagueManagePath = 'manage';

const routes: Routes = [
  {
    path: '',
    component: LeagueManageComponent,
  },
  {
    path: 'signups',
    component: LeagueManageSignupsComponent,
  },
  // {
  //   path: 'tiers',
  //   component: LeagueTierListFormComponent,
  // },
  // {
  //   path: 'settings',
  //   component: LeagueSettingsComponent,
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueManageRoutingModule {}

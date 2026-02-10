import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueRulesFormComponent } from '../league-rules-overview/league-rules-form/league-rules-form.component';
import { LeagueManageDraftComponent } from './league-manage-draft/league-manage-draft.component';
import { LeagueManageSignupsComponent } from './league-manage-signups/league-manage-signups.component';
import { LeagueManageComponent } from './league-manage.component';

export const LeagueManagePath = 'manage';

const routes: Routes = [
  {
    path: '',
    component: LeagueManageComponent,
  },
  {
    path: 'sign-ups',
    component: LeagueManageSignupsComponent,
  },
  {
    path: 'rules',
    component: LeagueRulesFormComponent,
  },
  {
    path: ':divisionKey/draft',
    component: LeagueManageDraftComponent,
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

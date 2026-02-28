import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueRulesFormComponent } from '../league-rules-overview/league-rules-form/league-rules-form.component';
import { LeagueManageDraftComponent } from './league-manage-draft/league-manage-draft.component';
import { LeagueManageSignupsComponent } from './league-manage-signups/league-manage-signups.component';
import { LeagueManageTradesComponent } from './league-manage-trades/league-manage-trades.component';
import { LeagueManageScheduleComponent } from './league-manage-schedule/league-manage-schedule.component';
import { LeagueManageDashboardComponent } from './league-manage-dashboard/league-manage-dashboard.component';
import { LeagueManageHubComponent } from './league-manage-hub.component';

export const LeagueManagePath = 'manage';

const routes: Routes = [
  {
    path: '',
    component: LeagueManageHubComponent,
    pathMatch: 'full',
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
    path: ':divisionKey',
    component: LeagueManageDashboardComponent,
  },
  {
    path: ':divisionKey/draft',
    component: LeagueManageDraftComponent,
  },
  {
    path: ':divisionKey/trades',
    component: LeagueManageTradesComponent,
  },
  {
    path: ':divisionKey/schedule',
    component: LeagueManageScheduleComponent,
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

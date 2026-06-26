import { Routes } from '@angular/router';
import { LeagueRulesFormComponent } from '../league-rules-overview/league-rules-form/league-rules-form.component';
import { LeagueManageDashboardComponent } from './league-manage-dashboard/league-manage-dashboard.component';
import { LeagueManageDraftComponent } from './league-manage-draft/league-manage-draft.component';
import { LeagueManageHubComponent } from './league-manage-hub.component';
import { LeagueManageScheduleComponent } from './league-manage-schedule/league-manage-schedule.component';
import { LeagueManageSignupsComponent } from './league-manage-signups/league-manage-signups.component';
import { LeagueManageTradesComponent } from './league-manage-trades/league-manage-trades.component';
import { LeagueSettingsComponent } from './league-settings/league-settings.component';

export const routes: Routes = [
  {
    path: '',
    component: LeagueManageHubComponent,
    pathMatch: 'full',
  },
  {
    path: 'settings',
    component: LeagueSettingsComponent,
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
    path: 'drafts/:draftKey',
    component: LeagueManageDashboardComponent,
  },
  {
    path: 'drafts/:draftKey/draft',
    component: LeagueManageDraftComponent,
  },
  {
    path: 'stages/:stageId/trades',
    component: LeagueManageTradesComponent,
  },
  {
    path: 'stages/:stageId/schedule',
    component: LeagueManageScheduleComponent,
  },
];

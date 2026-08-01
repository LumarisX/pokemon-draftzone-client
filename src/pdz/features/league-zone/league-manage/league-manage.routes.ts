import { Routes } from '@angular/router';
import { LeagueRulesFormComponent } from '../league-rules-overview/league-rules-form/league-rules-form.component';
import { StageBuilderPageComponent } from '../league-stage-builder/stage-builder-page.component';
import { LeagueManageDashboardComponent } from './league-manage-dashboard/league-manage-dashboard.component';
import { LeagueManageDraftComponent } from './league-manage-draft/league-manage-draft.component';
import { LeagueManageHubComponent } from './league-manage-hub.component';
import { LeagueManageScheduleComponent } from './league-manage-schedule/league-manage-schedule.component';
import { LeagueManageSignupsComponent } from './league-manage-signups/league-manage-signups.component';
import { LeagueManageTradesComponent } from './league-manage-trades/league-manage-trades.component';
import { LeagueSettingsComponent } from './league-settings/league-settings.component';
import { StageManagerComponent } from './stage-manager/stage-manager.component';
import { TradeManagerComponent } from './trade-manager/trade-manager.component';

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
    path: 'drafts/:draftSlug',
    component: LeagueManageDashboardComponent,
  },
  {
    path: 'drafts/:draftSlug/draft',
    component: LeagueManageDraftComponent,
  },
  {
    path: 'trades',
    component: TradeManagerComponent,
  },
  {
    path: 'stages',
    component: StageManagerComponent,
  },
  {
    path: 'stages/:stageId/trades',
    component: TradeManagerComponent,
  },
  {
    path: 'stages/:stageId/trades/legacy',
    component: LeagueManageTradesComponent,
  },
  {
    path: 'stages/:stageId/schedule',
    component: LeagueManageScheduleComponent,
  },
  {
    // Tournament-scoped, not stage-scoped: the builder edits the shared round
    // axis and every stage laid across it, which no single stage owns.
    path: 'bracket',
    component: StageBuilderPageComponent,
  },
  {
    // Where the per-stage builder used to live. Kept as a redirect so bookmarks
    // and in-app links from before the move still land somewhere useful.
    path: 'stages/:stageId/bracket',
    redirectTo: 'bracket',
  },
];

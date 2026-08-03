import { Routes } from '@angular/router';
import { LeagueRulesFormComponent } from '../league-rules-overview/league-rules-form/league-rules-form.component';
import { LeagueScheduleComponent } from '../league-stage-builder/stage-builder-page.component';
import { LeagueManageDashboardComponent } from './league-manage-dashboard/league-manage-dashboard.component';
import { LeagueManageDraftComponent } from './league-manage-draft/league-manage-draft.component';
import { LeagueManageHubComponent } from './league-manage-hub.component';
import { LeagueManageScheduleComponent } from './league-manage-schedule/league-manage-schedule.component';
import { LeagueManageSignupsComponent } from './league-manage-signups/league-manage-signups.component';
import { LeagueManageTradesComponent } from './league-manage-trades/league-manage-trades.component';
import { LeagueSettingsComponent } from './league-settings/league-settings.component';
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
  // Trades are scoped to a draft pool, not a stage: only teams that drafted
  // together can trade, and free agency is whatever their pool left untaken.
  {
    path: 'trades',
    component: TradeManagerComponent,
  },
  {
    path: 'drafts/:draftSlug/trades',
    component: TradeManagerComponent,
  },
  {
    path: 'stages/:stageId/trades/legacy',
    component: LeagueManageTradesComponent,
  },

  {
    path: 'schedule',
    component: LeagueScheduleComponent,
  },
  // Tournament-scoped, not stage-scoped: the page loads every round from
  // getSchedule() and groups matches by stage itself.
  {
    path: 'results',
    component: LeagueManageScheduleComponent,
  },
  {
    // Where the per-stage results editor used to live. Kept as a redirect so the
    // hub's per-stage links and old bookmarks still land somewhere useful.
    path: 'stages/:stageId/schedule',
    redirectTo: 'results',
  },
  {
    // The standalone stage list is gone: creating a stage and setting its
    // visibility both belong with the matchups they describe, and are done on
    // the builder itself.
    path: 'stages',
    // Full match only: a prefix redirect here would swallow the stage-scoped
    // routes above and append their segments onto the builder's path.
    pathMatch: 'full',
    redirectTo: 'schedule',
  },
];

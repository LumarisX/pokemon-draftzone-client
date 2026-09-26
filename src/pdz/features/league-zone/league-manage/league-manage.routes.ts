import { Routes } from '@angular/router';
import { LeagueRulesFormComponent } from '../league-rules-overview/league-rules-form/league-rules-form.component';
import { LeagueScheduleComponent } from '../league-stage-builder/stage-builder-page.component';
import { LeagueManageDraftComponent } from './league-manage-draft/league-manage-draft.component';
import { LeagueManageResultsComponent } from './league-manage-results/league-manage-results.component';
import { LeagueOrganizersComponent } from './league-organizers/league-organizers.component';
import { TradeManagerComponent } from './trade-manager/trade-manager.component';

export const routes: Routes = [
  {
    path: 'organizers',
    component: LeagueOrganizersComponent,
  },
  {
    path: 'rules',
    component: LeagueRulesFormComponent,
  },
  {
    path: 'pools/:poolSlug/draft',
    component: LeagueManageDraftComponent,
  },
  {
    path: 'drafts/:poolSlug/draft',
    redirectTo: 'pools/:poolSlug/draft',
  },
  {
    path: 'trades',
    component: TradeManagerComponent,
  },
  {
    path: 'pools/:poolSlug/trades',
    component: TradeManagerComponent,
  },
  {
    path: 'drafts/:poolSlug/trades',
    redirectTo: 'pools/:poolSlug/trades',
  },
  {
    path: 'schedule',
    component: LeagueScheduleComponent,
  },
  {
    path: 'results',
    component: LeagueManageResultsComponent,
  },
  {
    path: 'stages/:stageSlug/schedule',
    redirectTo: 'results',
  },
  {
    path: 'stages',
    pathMatch: 'full',
    redirectTo: 'schedule',
  },
  {
    path: 'settings',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: '',
    loadChildren: () =>
      import('../tournament-settings/tournament-settings.routes').then(
        (m) => m.routes,
      ),
  },
];

import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { LegacyDraftListComponent } from '../legacy/draft-list/legacy-draft-list.component';
import { LegacyDraftShellComponent } from '../legacy/draft-shell/legacy-draft-shell.component';
import { LegacyDraftTeamComponent } from '../legacy/draft-team/legacy-draft-team.component';
import { DraftFormEditComponent } from './draft-form/draft-form-edit/draft-form-edit.component';
import { DraftFormNewComponent } from './draft-form/draft-form-new/draft-form-new.component';
import { DraftStatsComponent } from './draft-stats/draft-stats.component';

const draftPages: Routes = [
  {
    path: 'new',
    component: DraftFormNewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'edit',
    component: DraftFormEditComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'archives/:teamId/stats',
    component: DraftStatsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':teamId/matchup/:matchupId',
    loadChildren: () =>
      import('../matchup-overview/matchup.routes').then((m) => m.routes),
  },
];

const draftPage: Routes = [
  {
    path: ':teamId',
    loadChildren: () =>
      import('../opponent-overview/opponent.routes').then((m) => m.routes),
  },
];

export const routes: Routes = [
  {
    path: '',
    component: LegacyDraftListComponent,
    canActivate: [AuthGuard],
  },
  ...draftPages,
  {
    path: ':teamId/stats',
    component: DraftStatsComponent,
    canActivate: [AuthGuard],
    data: { live: true },
  },
  {
    path: ':teamId',
    pathMatch: 'full',
    component: LegacyDraftShellComponent,
    canActivate: [AuthGuard],
    children: [{ path: '', component: LegacyDraftTeamComponent }],
  },
  ...draftPage,
];

export const externalRoutes: Routes = [
  {
    path: '',
    redirectTo: `/${LEAGUE_ZONE_PATH}`,
    pathMatch: 'full',
  },
  ...draftPages,
  {
    path: ':teamId/stats',
    redirectTo: ':teamId',
  },
  ...draftPage,
];

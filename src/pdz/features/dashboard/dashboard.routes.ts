import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { EXTERNAL_TOURNAMENTS_PATH } from '@pdz/core/route-paths';
import {
  DRAFT_AREA,
  EXTERNAL_DRAFTS_AREA,
} from '@pdz/features/drafts/draft-area';
import { DashboardComponent } from './dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: EXTERNAL_TOURNAMENTS_PATH,
    providers: [{ provide: DRAFT_AREA, useValue: EXTERNAL_DRAFTS_AREA }],
    loadChildren: () =>
      import('@pdz/features/drafts/draft-overview/draft.routes').then(
        (m) => m.externalRoutes,
      ),
  },
];

import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { ArchiveStatsComponent } from './archive-stats/archive-stats.component';
import { DraftArchiveComponent } from './draft-archives/draft-archives.component';
import { DraftFormEditComponent } from './draft-form/draft-form-edit/draft-form-edit.component';
import { DraftFormNewComponent } from './draft-form/draft-form-new/draft-form-new.component';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';
import { DraftStatsComponent } from './draft-stats/draft-stats.component';

export const routes: Routes = [
  {
    path: '',
    component: DraftPreviewComponent,
    canActivate: [AuthGuard],
  },
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
    path: 'archives',
    component: DraftArchiveComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':teamId/stats',
    component: DraftStatsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'archives/:teamId/stats',
    component: ArchiveStatsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':teamId',
    loadChildren: () =>
      import('../opponent-overview/opponent.routes').then((m) => m.routes),
  },
  {
    path: ':teamId/matchup/:matchupId',
    loadChildren: () =>
      import('../matchup-overview/matchup.routes').then((m) => m.routes),
  },
];

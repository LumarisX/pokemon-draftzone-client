import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { OpponentFormComponent } from './opponent-form/opponent-form.component';
import { OpponentOverviewComponent } from './opponent-overview.component';
import { OpponentTeamPreviewComponent } from './opponent-preview/opponent-preview.component';
import { OpponentScoreComponent } from './opponent-score/opponent-score.component';

export const routes: Routes = [
  {
    path: '',
    component: OpponentOverviewComponent,
    children: [
      {
        path: '',
        component: OpponentTeamPreviewComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'form',
        component: OpponentFormComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'score',
        component: OpponentScoreComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];

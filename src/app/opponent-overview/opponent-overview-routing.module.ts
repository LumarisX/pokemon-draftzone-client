import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpponentOverviewComponent } from './opponent-overview.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { MatchupOverviewComponent } from '../matchup-overview/matchup-overview.component';

const routes: Routes = [
  {
    path: 'draft/:teamid',
    component: OpponentOverviewComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./opponent-preview/opponent-preview.module').then(
            (m) => m.OpponentPreviewModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'new',
        loadChildren: () =>
          import('./opponent-form/opponent-form.module').then(
            (m) => m.OpponentFormModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'edit',
        loadChildren: () =>
          import('./opponent-form/opponent-form.module').then(
            (m) => m.OpponentFormModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'score',
        loadChildren: () =>
          import('./opponent-score/opponent-score.module').then(
            (m) => m.OpponentScoreModule
          ),
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpponentOverviewRoutingModule {}

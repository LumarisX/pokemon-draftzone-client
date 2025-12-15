import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { OpponentOverviewComponent } from './opponent-overview.component';
import { OpponentTeamPreviewComponent } from './opponent-preview/opponent-preview.component';
import { OpponentScoreComponent } from './opponent-score/opponent-score.component';
import { OpponentSchedule } from './opponent-schedule/opponent-schedule.component';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { OpponentFormComponent } from './opponent-form/opponent-form.component';

const routes: Routes = [
  {
    path: DraftOverviewPath + '/:teamid',
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
      {
        path: 'schedule',
        component: OpponentSchedule,
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

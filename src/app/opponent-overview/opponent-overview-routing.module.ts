import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { OpponentOverviewComponent } from './opponent-overview.component';
import { OpponentTeamPreviewComponent } from './opponent-preview/opponent-preview.component';
import { OpponentFormNewComponent } from './opponent-form/opponent-form-new/opponent-form-new.component';
import { OpponentFormEditComponent } from './opponent-form/opponent-form-edit/opponent-form-edit.component';
import { OpponentScoreComponent } from './opponent-score/opponent-score.component';
import { OpponentSchedule } from './opponent-schedule/opponent-schedule.component';

const routes: Routes = [
  {
    path: 'drafts/:teamid',
    component: OpponentOverviewComponent,
    children: [
      {
        path: '',
        component: OpponentTeamPreviewComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'new',
        component: OpponentFormNewComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'edit',
        component: OpponentFormEditComponent,
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

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftOverviewComponent } from './draft-overview.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';
import { DraftFormNewComponent } from './draft-form/draft-form-new/draft-form-new.component';
import { DraftFormEditComponent } from './draft-form/draft-form-edit/draft-form-edit.component';
import { DraftArchiveComponent } from './draft-archives/draft-archives.component';
import { DraftStatsComponent } from './draft-stats/draft-stats.component';
import { OpponentFormEditComponent } from '../opponent-overview/opponent-form/opponent-form-edit/opponent-form-edit.component';
import { OpponentFormNewComponent } from '../opponent-overview/opponent-form/opponent-form-new/opponent-form-new.component';
import { OpponentOverviewComponent } from '../opponent-overview/opponent-overview.component';
import { OpponentTeamPreviewComponent } from '../opponent-overview/opponent-preview/opponent-preview.component';
import { OpponentSchedule } from '../opponent-overview/opponent-schedule/opponent-schedule.component';
import { OpponentScoreComponent } from '../opponent-overview/opponent-score/opponent-score.component';
import { DraftDashboardComponent } from './draft-dashboard/draft-dashboard.component';

export const DraftOverviewPath: string = 'drafts';

const routes: Routes = [
  {
    path: DraftOverviewPath,
    component: DraftOverviewComponent,
    children: [
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
        path: ':teamid',
        component: DraftDashboardComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    DraftOverviewComponent,
    DraftPreviewComponent,
    DraftFormNewComponent,
    DraftFormEditComponent,
    DraftArchiveComponent,
    DraftStatsComponent,
  ],
  exports: [RouterModule],
})
export class DraftOverviewRoutingModule {}

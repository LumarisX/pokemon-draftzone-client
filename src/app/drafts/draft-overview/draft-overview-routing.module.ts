import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { DraftArchiveComponent } from './draft-archives/draft-archives.component';
import { DraftFormEditComponent } from './draft-form/draft-form-edit/draft-form-edit.component';
import { DraftFormNewComponent } from './draft-form/draft-form-new/draft-form-new.component';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';
import { DraftStatsComponent } from './draft-stats/draft-stats.component';
import { ArchiveStatsComponent } from './archive-stats/archive-stats.component';

export const DraftOverviewPath: string = 'drafts';

const routes: Routes = [
  {
    path: DraftOverviewPath,
    component: DraftPreviewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${DraftOverviewPath}/new`,
    component: DraftFormNewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${DraftOverviewPath}/edit`,
    component: DraftFormEditComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${DraftOverviewPath}/archives`,
    component: DraftArchiveComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${DraftOverviewPath}/:teamId/stats`,
    component: DraftStatsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${DraftOverviewPath}/archives/:teamId/stats`,
    component: ArchiveStatsComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    DraftPreviewComponent,
    DraftFormNewComponent,
    DraftFormEditComponent,
    DraftArchiveComponent,
    DraftStatsComponent,
  ],
  exports: [RouterModule],
})
export class DraftOverviewRoutingModule {}

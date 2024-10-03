import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftOverviewComponent } from './draft-overview.component';
import { AuthGuard } from '@auth0/auth0-angular';
import { DraftStatsComponent } from './draft-stats/draft-stats.component';
import { DraftFormEditComponent } from './draft-form/draft-form-edit/draft-form-edit.component';
import { DraftFormNewComponent } from './draft-form/draft-form-new/draft-form-new.component';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';
import { DraftArchiveComponent } from './draft-archives/draft-archives.component';
const routes: Routes = [
  {
    path: 'drafts',
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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DraftOverviewRoutingModule {}

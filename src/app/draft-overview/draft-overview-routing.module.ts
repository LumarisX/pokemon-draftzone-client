import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftOverviewComponent } from './draft-overview.component';
import { AuthGuard } from '@auth0/auth0-angular';
const routes: Routes = [
  {
    path: 'draft',
    component: DraftOverviewComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./draft-preview/draft-preview.module').then(
            (m) => m.DraftPreviewModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'new',
        loadChildren: () =>
          import('./draft-form/draft-form.module').then(
            (m) => m.DraftFormModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'edit/:teamid',
        loadChildren: () =>
          import('./draft-form/draft-form.module').then(
            (m) => m.DraftFormModule
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'edit',
        redirectTo: '',
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

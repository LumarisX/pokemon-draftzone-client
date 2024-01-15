import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftOverviewComponent } from './draft-overview.component';
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
      },
      {
        path: 'new',
        loadChildren: () =>
          import('./draft-form/draft-form.module').then(
            (m) => m.DraftFormModule
          ),
      },
      {
        path: 'edit/:teamid',
        loadChildren: () =>
          import('./draft-form/draft-form.module').then(
            (m) => m.DraftFormModule
          ),
      },
      {
        path: 'edit',
        redirectTo: '',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DraftOverviewRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftPreviewComponent } from './draft-preview.component';
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: DraftPreviewComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DraftPreviewRoutingModule {}

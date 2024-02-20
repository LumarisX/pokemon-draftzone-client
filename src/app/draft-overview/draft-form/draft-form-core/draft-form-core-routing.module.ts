import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftFormCoreComponent } from './draft-form-core.component';
const routes: Routes = [
  {
    path: '',
    component: DraftFormCoreComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DraftFormRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftFormComponent } from './draft-form.component';
const routes: Routes = [
  {
    path: '',
    component: DraftFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DraftFormRoutingModule {}

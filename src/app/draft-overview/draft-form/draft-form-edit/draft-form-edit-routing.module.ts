import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftFormEditComponent } from './draft-form-edit.component';
const routes: Routes = [
  {
    path: '',
    component: DraftFormEditComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DraftFormEditRoutingModule {}

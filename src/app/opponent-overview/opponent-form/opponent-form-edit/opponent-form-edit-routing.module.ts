import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpponentFormEditComponent } from './opponent-form-edit.component';
const routes: Routes = [
  {
    path: '',
    component: OpponentFormEditComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpponentFormEditRoutingModule {}

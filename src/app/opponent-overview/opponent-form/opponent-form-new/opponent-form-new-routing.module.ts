import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpponentFormNewComponent } from './opponent-form-new.component';
const routes: Routes = [
  {
    path: '',
    component: OpponentFormNewComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpponentFormNewRoutingModule {}

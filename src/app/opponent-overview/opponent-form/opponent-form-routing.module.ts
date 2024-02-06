import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpponentFormComponent } from './opponent-form.component';
const routes: Routes = [
  {
    path: '',
    component: OpponentFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpponentFormRoutingModule {}

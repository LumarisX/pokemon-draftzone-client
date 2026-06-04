import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlannerComponent } from './plannner.component';

export const PlannerPath = 'planner';
const routes: Routes = [
  {
    path: '',
    component: PlannerComponent,
  },
  {
    path: ':tierListId',
    component: PlannerComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlannerRoutingModule {}

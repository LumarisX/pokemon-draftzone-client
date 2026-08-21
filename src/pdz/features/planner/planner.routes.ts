import { Routes } from '@angular/router';
import { PlannerComponent } from './planner.component';

export const routes: Routes = [
  {
    path: '',
    component: PlannerComponent,
  },
  {
    path: ':tierListId',
    component: PlannerComponent,
  },
];

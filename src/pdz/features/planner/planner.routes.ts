import { Routes } from '@angular/router';
import { plannerSyncResolver } from './planner-sync.service';
import { PlannerComponent } from './planner.component';

export const routes: Routes = [
  {
    path: '',
    component: PlannerComponent,
    resolve: { plannerSync: plannerSyncResolver },
  },
  {
    path: ':tierListId',
    component: PlannerComponent,
    resolve: { plannerSync: plannerSyncResolver },
  },
];

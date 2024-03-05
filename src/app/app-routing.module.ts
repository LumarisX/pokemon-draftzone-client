import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './homepage/homepage.component';
import { PlannerComponent } from './planner/plannner.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'planner', component: PlannerComponent },
  { path: 'draft', redirectTo: 'draft' },
  { path: 'error', redirectTo: 'error' },
  { path: 'matchup', redirectTo: 'draft' },
  { path: 'test', redirectTo: 'test' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

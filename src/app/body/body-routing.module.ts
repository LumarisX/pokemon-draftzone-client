import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from '../pages/about/about.component';
import { HomeComponent } from '../pages/homepage/homepage.component';
import { SettingsComponent } from '../pages/settings/settings.component';
import { PlannerComponent } from '../planner/plannner.component';
import { BodyComponent } from './body.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'planner', component: PlannerComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'draft', redirectTo: 'draft' },
  { path: 'error', redirectTo: 'error' },
  { path: 'matchup', redirectTo: 'draft' },
  { path: 'replay', redirectTo: 'replay' },
  { path: '**', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule],
})
export class BodyRoutingModule {}

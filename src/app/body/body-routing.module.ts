import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleZonePath } from '../battle-zone/battle-zone-routing.module';
import { HomeComponent } from '../pages/homepage/homepage.component';
import { SettingsComponent } from '../pages/settings/settings.component';
import { PlannerComponent } from '../planner/plannner.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'planner', component: PlannerComponent },
  { path: 'settings', component: SettingsComponent },
  {
    path: '',
    loadChildren: () =>
      import('../pages/page.module').then((m) => m.PageModule),
  },
  {
    path: BattleZonePath,
    loadChildren: () =>
      import('../battle-zone/battle-zone.module').then(
        (m) => m.BattleZoneModule,
      ),
  },
  { path: '**', component: HomeComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
    }),
  ],
  exports: [RouterModule],
})
export class BodyRoutingModule {}

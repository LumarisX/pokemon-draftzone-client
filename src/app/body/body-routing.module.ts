import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '../pages/homepage/homepage.component';
import { NotFoundComponent } from '../pages/not-found/not-found.component';
import { SettingsComponent } from '../pages/settings/settings.component';
import { PlannerComponent } from '../planner/plannner.component';
import { DebugPath } from '../debug/debug-routing.module';
import { LeagueZonePath } from '../league-zone/league-zone-routing.module';
import { ToolsPath } from '../tools/tools.router';

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
    path: LeagueZonePath,
    loadChildren: () =>
      import('../league-zone/league-zone.module').then(
        (m) => m.LeagueZoneModule,
      ),
  },
  {
    path: ToolsPath,
    loadChildren: () =>
      import('../tools/tools.module').then((m) => m.ToolsModule),
  },
  {
    path: DebugPath,
    loadChildren: () =>
      import('../debug/debug.module').then((m) => m.DebugModule),
  },
  { path: '**', component: NotFoundComponent },
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

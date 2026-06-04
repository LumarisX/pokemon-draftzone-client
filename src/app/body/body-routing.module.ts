import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DebugPath } from '../debug/debug-routing.module';
import { LeagueZonePath } from '../league-zone/league-zone-routing.module';
import { HomeComponent } from '../pages/homepage/homepage.component';
import { NotFoundComponent } from '../pages/not-found/not-found.component';
import { PlannerPath } from '../planner/planner-routing.module';
import { StatisticsPath } from '../statistics/statistics-routing.module';
import { TierListsPath } from '../tier-lists/tier-list-routing.module';
import { ToolsPath } from '../tools/tools.router';

const routes: Routes = [
  { path: '', component: HomeComponent },

  {
    path: '',
    loadChildren: () =>
      import('../pages/page.module').then((m) => m.PageModule),
  },
  {
    path: PlannerPath,
    loadChildren: () =>
      import('../planner/planner.module').then((m) => m.PlannerModule),
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
  {
    path: StatisticsPath,
    loadChildren: () =>
      import('../statistics/statistics.module').then((m) => m.StatisticsModule),
  },
  {
    path: TierListsPath,
    loadChildren: () =>
      import('../tier-lists/tier-list.module').then((m) => m.TierListModule),
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

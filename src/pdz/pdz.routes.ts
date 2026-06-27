import { Routes } from '@angular/router';
import {
  ADMIN_PATH,
  DEBUG_PATH,
  DRAFT_OVERVIEW_PATH,
  EXTERNAL_LINK_PATH,
  LEAGUE_ADS_PATH,
  LEAGUE_ZONE_PATH,
  PLANNER_PATH,
  STATISTICS_PATH,
  TIER_LIST_PATH,
  TOOLS_PATH,
} from '@pdz/core/route-paths';
import { adminGuard } from '@pdz/core/guards/admin/admin.guard';
import { HomeComponent } from '@pdz/features/pages/homepage/homepage.component';
import { NotFoundComponent } from '@pdz/features/pages/not-found/not-found.component';
import { externalLinkBypassGuard } from './features/pages/external-link/external-link.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: DRAFT_OVERVIEW_PATH,
    loadChildren: () =>
      import('@pdz/features/drafts/draft-overview/draft.routes').then(
        (m) => m.routes,
      ),
  },
  {
    path: PLANNER_PATH,
    loadChildren: () =>
      import('@pdz/features/planner/planner.routes').then((m) => m.routes),
  },
  {
    path: LEAGUE_ZONE_PATH,
    loadChildren: () =>
      import('@pdz/features/league-zone/league-zone.routes').then(
        (m) => m.routes,
      ),
  },
  {
    path: TOOLS_PATH,
    loadChildren: () =>
      import('@pdz/features/tools/tools.routes').then((m) => m.routes),
  },
  {
    path: DEBUG_PATH,
    loadChildren: () =>
      import('@pdz/core/debug/debug.routes').then((m) => m.routes),
  },
  {
    path: STATISTICS_PATH,
    loadChildren: () =>
      import('@pdz/features/statistics/statistics.routes').then(
        (m) => m.routes,
      ),
  },
  {
    path: TIER_LIST_PATH,
    loadChildren: () =>
      import('@pdz/features/tier-lists/tier-list.routes').then((m) => m.routes),
  },
  {
    path: 'matchup/:id',
    loadComponent: () =>
      import('@pdz/features/drafts/matchup-overview/matchup-shared.component').then(
        (c) => c.MatchupSharedComponent,
      ),
  },
  {
    path: LEAGUE_ADS_PATH,
    loadChildren: () =>
      import('@pdz/features/league-list/league-list.routes').then(
        (m) => m.routes,
      ),
  },
  {
    path: ADMIN_PATH,
    canActivate: [adminGuard],
    loadChildren: () =>
      import('@pdz/features/admin/admin.routes').then((m) => m.routes),
  },
  {
    path: 'supporters',
    loadComponent: () =>
      import('@pdz/features/pages/supporters/supporters.component').then(
        (c) => c.SupportersComponent,
      ),
  },
  {
    path: 'donate',
    loadComponent: () =>
      import('@pdz/features/pages/supporters/supporters.component').then(
        (c) => c.SupportersComponent,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('@pdz/features/pages/about/about.component').then(
        (c) => c.AboutComponent,
      ),
  },
  {
    path: EXTERNAL_LINK_PATH,
    loadComponent: () =>
      import('@pdz/features/pages/external-link/external-link.component').then(
        (c) => c.ExternalLinkComponent,
      ),
    canActivate: [externalLinkBypassGuard],
  },
  { path: '**', component: NotFoundComponent },
];

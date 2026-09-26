import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { LeagueCreateComponent } from './league-create/league-create.component';
import { LeagueLandingComponent } from './league-landing/league-landing.component';
import { legacyTournamentRedirect } from './legacy-tournament-redirect.guard';
import { TournamentCreateComponent } from './tournament-create/tournament-create.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: `/${DRAFT_OVERVIEW_PATH}`,
    pathMatch: 'full',
  },
  {
    path: 'new',
    component: LeagueCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `:leagueSlug`,
    component: LeagueLandingComponent,
  },
  {
    path: ':leagueSlug/tournaments/new',
    component: TournamentCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':leagueSlug/tournaments/:tournamentSlug',
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [legacyTournamentRedirect],
        children: [],
      },
      { path: '**', canActivate: [legacyTournamentRedirect], children: [] },
    ],
  },
];

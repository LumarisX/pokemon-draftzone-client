import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { MatchupOverviewComponent } from './matchup-overview.component';
import { DRAFT_MATCHUP_PAGE } from './matchup-page.config';

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: MatchupOverviewComponent,
    data: { matchup: DRAFT_MATCHUP_PAGE },
  },
];

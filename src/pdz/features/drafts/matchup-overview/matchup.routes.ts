import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { MatchupOverviewComponent } from './matchup-overview.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: MatchupOverviewComponent,
  },
];

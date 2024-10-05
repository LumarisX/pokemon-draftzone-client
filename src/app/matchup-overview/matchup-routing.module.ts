import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';
import { MatchupOverviewComponent } from './matchup-overview.component';
import { MatchupSharedComponent } from './matchup-shared.component';
import { AuthGuard } from '@auth0/auth0-angular';

const routes: Routes = [
  {
    path: 'drafts/matchup/:matchid',
    component: MatchupComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'drafts/:teamid/matchup',
    component: MatchupOverviewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'matchup/:id',
    component: MatchupSharedComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MatchupRoutingModule {}

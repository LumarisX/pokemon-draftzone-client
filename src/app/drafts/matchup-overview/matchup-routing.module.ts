import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { MatchupOverviewComponent } from './matchup-overview.component';
import { MatchupSharedComponent } from './matchup-shared.component';

const routes: Routes = [
  {
    path: DraftOverviewPath + '/:teamid/matchup',
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

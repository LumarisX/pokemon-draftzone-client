import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { MatchupOverviewComponent } from './matchup-overview.component';
import { MatchupSharedComponent } from './matchup-shared.component';
import { OwnerGuard } from '../../guards/owner.guard';

const routes: Routes = [
  {
    path: DraftOverviewPath + '/:teamid/matchup',
    component: MatchupOverviewComponent,
    canActivate: [AuthGuard, OwnerGuard],
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

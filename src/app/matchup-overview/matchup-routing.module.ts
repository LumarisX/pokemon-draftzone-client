import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';
import { MatchupOverviewComponent } from './matchup-overview.component';
import { MatchupSharedComponent } from './matchup-shared.component';

const routes: Routes = [
  { path: 'draft/matchup/:matchid', component: MatchupComponent },
  { path: 'draft/:teamid/matchup', component: MatchupOverviewComponent },
  { path: 'matchup/:id', component: MatchupSharedComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MatchupRoutingModule {}

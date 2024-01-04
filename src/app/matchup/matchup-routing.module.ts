import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchupComponent } from './matchup.component';

const routes: Routes = [
  { path: 'draft/matchup/:matchid', component: MatchupComponent },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class MatchupRoutingModule {

}
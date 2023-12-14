import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchupComponent } from './matchup.component';

const routes: Routes = [
  { path: 'drafts/:teamid/:matchid', component: MatchupComponent },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class MatchupRoutingModule {

}
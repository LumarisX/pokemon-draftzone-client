import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatchupComponent } from '../matchup/matchup.component';
import { DraftOverviewComponent } from './draft-overview.component';
const routes: Routes = [
  { path: 'draft', component: DraftOverviewComponent },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class DraftOverviewRoutingModule {

}
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpponentOverviewComponent } from './opponent-overview.component';

const routes: Routes = [
  { path: 'draft/:teamid', component: OpponentOverviewComponent }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class OpponentOverviewRoutingModule {

}
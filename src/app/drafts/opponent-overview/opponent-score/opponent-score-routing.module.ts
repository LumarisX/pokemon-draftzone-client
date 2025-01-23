import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpponentScoreComponent } from './opponent-score.component';
const routes: Routes = [
  {
    path: '',
    component: OpponentScoreComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpponentScoreRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReplayComponent } from './relay.component';
const routes: Routes = [
  {
    path: 'replay',
    component: ReplayComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReplayRoutingModule {}

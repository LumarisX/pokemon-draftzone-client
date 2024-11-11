import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BZLandingComponent } from './landing.component';

export const BattleZonePath: string = 'battle-zone';

const routes: Routes = [
  {
    path: BattleZonePath + '/pdbl',
    component: BZLandingComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BattleZoneRoutingModule {}

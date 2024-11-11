import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BZLandingComponent } from './landing.component';
import { BZTierListComponent } from './tier-list/tier-list.component';

export const BattleZonePath: string = 'battle-zone';

const routes: Routes = [
  {
    path: BattleZonePath + '/pdbl',
    component: BZLandingComponent,
  },
  {
    path: BattleZonePath + '/pdbl/tier-list',
    component: BZTierListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BattleZoneRoutingModule {}

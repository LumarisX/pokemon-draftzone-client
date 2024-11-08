import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BattleZoneComponent } from './battle-zone.component';

export const BattleZonePath: string = 'battle-zone';

const routes: Routes = [
  {
    path: BattleZonePath + '/pdbl',
    component: BattleZoneComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BattleZoneRoutingModule {}

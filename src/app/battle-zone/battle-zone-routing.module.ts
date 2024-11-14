import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BZLandingComponent } from './landing.component';
import { BZTierListComponent } from './tier-list/tier-list.component';
import { BZSignUpComponent } from './sign-up/sign-up.component';
import { BZRulesComponent } from './rules/rules.component';

export const BattleZonePath: string = 'battle-zone';

const routes: Routes = [
  {
    path: 'pdbl',
    component: BZLandingComponent,
  },
  {
    path: 'pdbl/sign-up',
    component: BZSignUpComponent,
  },
  {
    path: 'pdbl/rules',
    component: BZRulesComponent,
  },
  {
    path: 'pdbl/tier-list',
    component: BZTierListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BattleZoneRoutingModule {}

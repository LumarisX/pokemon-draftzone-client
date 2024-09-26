import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueFormComponent } from './form/league-form.component';
import { LeagueAdListComponent } from './league-list.component';
const routes: Routes = [
  {
    path: 'leagues',
    component: LeagueAdListComponent,
    children: [
      {
        path: 'new-ad',
        component: LeagueFormComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LeagueAdRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeagueTierListFormComponent } from './league-tier-list/league-tier-list-form/league-tier-list-form.component';
import { unsavedChangesGuard } from './league-tier-list/league-tier-list-form/unsaved-changes.guard';
import { LeagueTierListComponent } from './league-tier-list/league-tier-list.component';

export const TierListsPath = 'tier-lists';
const routes: Routes = [
  {
    path: ':tierListId',
    component: LeagueTierListComponent,
  },
  {
    path: ':tierListId/edit',
    component: LeagueTierListFormComponent,
    canDeactivate: [unsavedChangesGuard],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TierListRoutingModule {}

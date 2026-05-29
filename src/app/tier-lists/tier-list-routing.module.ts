import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TierListFormComponent } from './tier-list/tier-list-form/tier-list-form.component';
import { unsavedChangesGuard } from './tier-list/tier-list-form/unsaved-changes.guard';
import { TierListComponent } from './tier-list/tier-list.component';

export const TierListsPath = 'tier-lists';
const routes: Routes = [
  {
    path: '',
    component: TierListComponent,
  },
  {
    path: ':tierListId',
    component: TierListComponent,
  },
  {
    path: ':tierListId/edit',
    component: TierListFormComponent,
    canDeactivate: [unsavedChangesGuard],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TierListRoutingModule {}

import { Routes } from '@angular/router';
import { TierListFormComponent } from './tier-list/tier-list-form/tier-list-form.component';
import { unsavedChangesGuard } from './tier-list/tier-list-form/unsaved-changes.guard';
import { TierListComponent } from './tier-list/tier-list.component';

export const routes: Routes = [
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

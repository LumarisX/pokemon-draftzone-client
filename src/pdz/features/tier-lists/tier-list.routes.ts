import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { TierListBrowseComponent } from './tier-list-browse/tier-list-browse.component';
import { TierListCreateComponent } from './tier-list-create/tier-list-create.component';
import { TierListShellComponent } from './tier-list-shell.component';
import { TierListFormComponent } from './tier-list/tier-list-form/tier-list-form.component';
import { unsavedChangesGuard } from './tier-list/tier-list-form/unsaved-changes.guard';
import { TierListComponent } from './tier-list/tier-list.component';

export const routes: Routes = [
  {
    path: '',
    component: TierListBrowseComponent,
    pathMatch: 'full',
  },
  {
    path: 'new',
    component: TierListCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: TierListShellComponent,
    children: [
      {
        path: ':tierListSlug',
        component: TierListComponent,
      },
      {
        path: ':tierListSlug/edit',
        component: TierListFormComponent,
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
];

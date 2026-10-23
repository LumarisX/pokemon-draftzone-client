import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { unsavedChangesGuard } from '@pdz/core/guards/unsaved-changes/unsaved-changes.guard';
import { TierListBrowseComponent } from './tier-list-browse/tier-list-browse.component';
import { TierListCompareComponent } from './tier-list-compare/tier-list-compare.component';
import { TierListCreateComponent } from './tier-list-create/tier-list-create.component';
import { TierListHistoryComponent } from './tier-list-history/tier-list-history.component';
import { TierListImportComponent } from './tier-list-import/tier-list-import.component';
import { TierListInviteComponent } from './tier-list-invite/tier-list-invite.component';
import { TierListMineComponent } from './tier-list-mine/tier-list-mine.component';
import { TierListShellComponent } from './tier-list-shell.component';
import { TierListFormComponent } from './tier-list/tier-list-form/tier-list-form.component';
import { TierListComponent } from './tier-list/tier-list.component';

export const routes: Routes = [
  {
    path: '',
    component: TierListBrowseComponent,
    pathMatch: 'full',
  },
  {
    path: 'mine',
    component: TierListMineComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'new',
    component: TierListCreateComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'import',
    component: TierListImportComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'invite/:token',
    component: TierListInviteComponent,
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
        canActivate: [AuthGuard],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: ':tierListSlug/import',
        component: TierListImportComponent,
        canActivate: [AuthGuard],
      },
      {
        path: ':tierListSlug/history',
        component: TierListHistoryComponent,
      },
      {
        path: ':tierListSlug/compare',
        component: TierListCompareComponent,
      },
    ],
  },
];

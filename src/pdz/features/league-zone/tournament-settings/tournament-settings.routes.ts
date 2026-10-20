import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@pdz/core/guards/unsaved-changes/unsaved-changes.guard';
import { TOURNAMENT_FINAL_RESULTS_PATH } from '@pdz/core/route-paths';
import { FinalResultsPageComponent } from './final-results-page.component';
import { ManageOverviewComponent } from './manage-overview.component';
import { SettingsPageComponent } from './settings-page.component';
import { SettingsShellComponent } from './settings-shell.component';
import { SignupsPageComponent } from './signups-page.component';

export const routes: Routes = [
  {
    path: '',
    component: SettingsShellComponent,
    children: [
      {
        path: '',
        component: ManageOverviewComponent,
      },
      {
        path: 'settings',
        component: SettingsPageComponent,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'sign-ups',
        component: SignupsPageComponent,
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: TOURNAMENT_FINAL_RESULTS_PATH,
        component: FinalResultsPageComponent,
      },
      {
        path: 'identity',
        redirectTo: 'settings',
      },
      {
        path: 'draft',
        redirectTo: 'settings',
      },
      {
        path: 'season',
        redirectTo: 'settings',
      },
      {
        path: 'integrations',
        redirectTo: 'settings',
      },
    ],
  },
];

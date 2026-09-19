import { Routes } from '@angular/router';
import { DraftSettingsPageComponent } from './draft-settings-page.component';
import { SettingsDashboardComponent } from './settings-dashboard.component';
import { SettingsSectionPageComponent } from './settings-section-page.component';
import { SettingsShellComponent } from './settings-shell.component';
import { SignupSettingsPageComponent } from './signup-settings-page.component';

export const routes: Routes = [
  {
    path: '',
    component: SettingsShellComponent,
    children: [
      {
        path: '',
        component: SettingsDashboardComponent,
      },
      {
        path: 'identity',
        component: SettingsSectionPageComponent,
        data: { section: 'identity' },
      },
      {
        path: 'sign-ups',
        component: SignupSettingsPageComponent,
      },
      {
        path: 'draft',
        component: DraftSettingsPageComponent,
      },
      {
        path: 'season',
        component: SettingsSectionPageComponent,
        data: { section: 'season' },
      },
      {
        path: 'integrations',
        component: SettingsSectionPageComponent,
        data: { section: 'integrations' },
      },
    ],
  },
];

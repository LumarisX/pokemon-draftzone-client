import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then(
        (c) => c.AdminDashboardComponent,
      ),
  },
  {
    path: 'chat-reports',
    loadComponent: () =>
      import('./admin-chat-reports/admin-chat-reports.component').then(
        (c) => c.AdminChatReportsComponent,
      ),
  },
  {
    path: 'reset-display-name',
    loadComponent: () =>
      import('./reset-display-name/reset-display-name.component').then(
        (c) => c.ResetDisplayNameComponent,
      ),
  },
];

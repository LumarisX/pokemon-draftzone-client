import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then(
        (c) => c.AdminDashboardComponent,
      ),
  },
];

import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { DraftsV2Component } from './drafts-v2.component';

export const routes: Routes = [
  {
    path: '',
    component: DraftsV2Component,
    canActivate: [AuthGuard],
  },
];

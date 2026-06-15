import { Routes } from '@angular/router';
import { AuthGuard } from '@auth0/auth0-angular';
import { LeagueFormComponent } from './form/league-form.component';
import { LeagueAdListComponent } from './league-list.component';
import { LeagueManageComponent } from './manage/league-manage.component';

export const routes: Routes = [
  {
    path: '',
    component: LeagueAdListComponent,
  },
  {
    path: 'manage',
    component: LeagueManageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'manage/new',
    component: LeagueFormComponent,
    canActivate: [AuthGuard],
  },
];

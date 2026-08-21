import { Routes } from '@angular/router';
import { DebugComponent } from './debug.component';
import { DebugSpritesComponent } from './sprites/debug-sprites.component';

export const routes: Routes = [
  {
    path: '',
    component: DebugComponent,
  },
  {
    path: 'sprites',
    component: DebugSpritesComponent,
  },
];

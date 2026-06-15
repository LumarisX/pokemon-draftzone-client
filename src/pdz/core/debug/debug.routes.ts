import { Routes } from '@angular/router';
import { DebugComponentsComponent } from './components/debug-components.component';
import { DebugComponent } from './debug.component';
import { DebugLoadingComponent } from './loading/debug-loading.component';
import { DebugSpritesComponent } from './sprites/debug-sprites.component';
import { DebugThemesComponent } from './themes/debug-themes.component';

export const routes: Routes = [
  {
    path: '',
    component: DebugComponent,
  },
  {
    path: 'sprites',
    component: DebugSpritesComponent,
  },
  {
    path: 'components',
    component: DebugComponentsComponent,
  },
  {
    path: 'themes',
    component: DebugThemesComponent,
  },
  {
    path: 'loading',
    component: DebugLoadingComponent,
  },
];

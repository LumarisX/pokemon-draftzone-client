import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DebugSpritesComponent } from './sprites/debug-sprites.component';
import { DebugComponent } from './debug.component';
import { DebugComponentsComponent } from './components/debug-components.component';
import { DebugThemesComponent } from './themes/debug-themes.component';
import { DebugLoadingComponent } from './loading/debug-loading.component';

export const DebugPath: string = 'debug';

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DebugRoutingModule {}

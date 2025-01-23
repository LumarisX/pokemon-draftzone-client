import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DebugSpritesComponent } from './sprites/debug-sprites.component';
import { DebugComponent } from './debug.component';
import { DebugComponentsComponent } from './components/debug-components.component';

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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DebugRoutingModule {}

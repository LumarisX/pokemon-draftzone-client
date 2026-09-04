import { Routes } from '@angular/router';
import { DebugComponent } from './debug.component';
import { DebugCalculatorComponent } from './calculator/debug-calculator.component';
import { DebugComponentsComponent } from './components/debug-components.component';
import { DebugSpritesComponent } from './sprites/debug-sprites.component';

export const routes: Routes = [
  {
    path: '',
    component: DebugComponent,
  },
  {
    path: 'components',
    component: DebugComponentsComponent,
  },
  {
    path: 'sprites',
    component: DebugSpritesComponent,
  },
  {
    path: 'calculator',
    component: DebugCalculatorComponent,
  },
];

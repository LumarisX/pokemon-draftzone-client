import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestSpritesComponent } from './sprites/test-sprites.component';

export const TestPath: string = 'test';

const routes: Routes = [
  {
    path: 'sprites',
    component: TestSpritesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestRoutingModule {}

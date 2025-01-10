import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupportersComponent } from './supporters/supporters.component';
import { AboutComponent } from './about/about.component';

const routes: Routes = [
  {
    path: 'supporters',
    component: SupportersComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PageRoutingModule {}

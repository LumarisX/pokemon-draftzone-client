import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupportersComponent } from './supporters/supporters.component';
import { AboutComponent } from './about/about.component';
import { ExternalLinkComponent } from './external-link/external-link.component';
import { externalLinkBypassGuard } from './external-link/external-link.guard';

export const ExternalLinkPath = 'external';

const routes: Routes = [
  {
    path: 'supporters',
    component: SupportersComponent,
  },
  {
    path: 'donate',
    component: SupportersComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: ExternalLinkPath,
    component: ExternalLinkComponent,
    canActivate: [externalLinkBypassGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PageRoutingModule {}

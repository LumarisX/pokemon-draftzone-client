import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DraftOverviewComponent } from './draft-overview.component';

const routes: Routes = [
  { path: 'drafts', component: DraftOverviewComponent },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class DraftOverviewRoutingModule {

}
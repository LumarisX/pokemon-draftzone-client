import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuickDraftComponent } from './quick-draft.component';

const routes: Routes = [
  {
    path: '',
    component: QuickDraftComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuickDraftRoutingModule {}

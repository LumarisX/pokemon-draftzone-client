import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuickDraftComponent } from './quick-draft.component';
import { QuickDraftComponent as QuickDraftComponentTest } from '../quick-draft copy/quick-draft.component';

const routes: Routes = [
  {
    path: '',
    component: QuickDraftComponent,
  },
  {
    path: 'test',
    component: QuickDraftComponentTest,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuickDraftRoutingModule {}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OpponentTeamPreviewComponent } from './opponent-preview.component';
const routes: Routes = [
  {
    path: '',
    component: OpponentTeamPreviewComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpponentPreviewRoutingModule {}

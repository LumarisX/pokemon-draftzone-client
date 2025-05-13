import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpponentOverviewComponent } from './opponent-overview.component';
import { OpponentTeamPreviewComponent } from './opponent-preview/opponent-preview.component';

@NgModule({
  imports: [
    CommonModule,
    OpponentOverviewComponent,
    OpponentTeamPreviewComponent,
  ],
  exports: [OpponentOverviewComponent],
})
export class OpponentOverviewModule {}

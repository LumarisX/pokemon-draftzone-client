import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpponentPreviewRoutingModule } from './opponent-preview-routing.module';
import { OpponentTeamPreviewComponent } from './opponent-preview.component';

@NgModule({
  imports: [
    CommonModule,
    OpponentTeamPreviewComponent,
    OpponentPreviewRoutingModule,
  ],
  exports: [],
})
export class OpponentPreviewModule {}

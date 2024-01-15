import { CommonModule } from '@angular/common';
import { DraftPreviewRoutingModule } from './draft-preview-routing.module';
import { DraftPreviewComponent } from './draft-preview.component';
import { NgModule } from '@angular/core';
import { DraftFormComponent } from '../draft-form/draft-form.component';

@NgModule({
  imports: [
    CommonModule,
    DraftPreviewComponent,
    DraftFormComponent,
    DraftPreviewRoutingModule,
  ],
  exports: [],
})
export class DraftPreviewModule {}

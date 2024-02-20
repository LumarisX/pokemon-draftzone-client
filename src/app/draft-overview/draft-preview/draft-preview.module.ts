import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftFormCoreComponent } from '../draft-form/draft-form-core/draft-form-core.component';
import { DraftPreviewRoutingModule } from './draft-preview-routing.module';
import { DraftPreviewComponent } from './draft-preview.component';

@NgModule({
  imports: [
    CommonModule,
    DraftPreviewComponent,
    DraftFormCoreComponent,
    DraftPreviewRoutingModule,
  ],
  exports: [],
})
export class DraftPreviewModule {}

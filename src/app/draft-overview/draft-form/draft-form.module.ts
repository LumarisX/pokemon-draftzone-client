import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftFormRoutingModule } from './draft-form-routing.module';
import { DraftFormComponent } from './draft-form.component';
import { DraftPreviewComponent } from '../draft-preview/draft-preview.component';

@NgModule({
  imports: [
    CommonModule,
    DraftFormComponent,
    DraftPreviewComponent,
    DraftFormRoutingModule,
  ],
  exports: [],
})
export class DraftFormModule {}

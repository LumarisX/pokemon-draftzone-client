import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftOverviewRoutingModule } from './draft-overview-routing.module';
import { DraftOverviewComponent } from './draft-overview.component';
import { DraftPreviewComponent } from './draft-preview/draft-preview.component';
import { DraftFormCoreComponent } from './draft-form/draft-form-core/draft-form-core.component';
import { DraftFormNewComponent } from './draft-form/draft-form-new/draft-form-new.component';
import { DraftFormEditComponent } from './draft-form/draft-form-edit/draft-form-edit.component';

@NgModule({
  imports: [
    CommonModule,
    DraftOverviewComponent,
    DraftFormNewComponent,
    DraftFormCoreComponent,
    DraftFormEditComponent,
    DraftPreviewComponent,
    DraftOverviewRoutingModule,
  ],
  exports: [DraftOverviewComponent],
})
export class DraftOverviewModule {}

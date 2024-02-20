import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftFormEditComponent } from '../draft-form-edit/draft-form-edit.component';
import { DraftFormRoutingModule } from './draft-form-core-routing.module';
import { DraftFormCoreComponent } from './draft-form-core.component';

@NgModule({
  imports: [
    CommonModule,
    DraftFormCoreComponent,
    DraftFormEditComponent,
    DraftFormRoutingModule,
    DraftFormRoutingModule,
  ],
  exports: [],
})
export class DraftFormModule {}

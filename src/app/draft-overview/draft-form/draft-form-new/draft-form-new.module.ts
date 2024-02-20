import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftFormNewRoutingModule } from './draft-form-new-routing.module';
import { DraftFormNewComponent } from './draft-form-new.component';

@NgModule({
  imports: [CommonModule, DraftFormNewComponent, DraftFormNewRoutingModule],
  exports: [],
})
export class DraftFormNewModule {}

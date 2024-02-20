import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftFormEditRoutingModule } from './draft-form-edit-routing.module';
import { DraftFormEditComponent } from './draft-form-edit.component';

@NgModule({
  imports: [CommonModule, DraftFormEditComponent, DraftFormEditRoutingModule],
  exports: [],
})
export class DraftFormEditModule {}

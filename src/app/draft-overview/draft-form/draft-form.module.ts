import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DraftFormRoutingModule } from './draft-form-routing.module';
import { DraftFormComponent } from './draft-form.component';

@NgModule({
  imports: [CommonModule, DraftFormComponent, DraftFormRoutingModule],
  exports: [],
})
export class DraftFormModule {}

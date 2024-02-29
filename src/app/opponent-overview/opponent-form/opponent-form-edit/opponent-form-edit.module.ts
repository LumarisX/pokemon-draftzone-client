import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpponentFormEditComponent } from './opponent-form-edit.component';
import { OpponentFormEditRoutingModule } from './opponent-form-edit-routing.module';

@NgModule({
  imports: [
    CommonModule,
    OpponentFormEditComponent,
    OpponentFormEditRoutingModule,
  ],
  exports: [],
})
export class OpponentFormEditModule {}

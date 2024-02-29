import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpponentFormNewRoutingModule } from './opponent-form-new-routing.module';
import { OpponentFormNewComponent } from './opponent-form-new.component';

@NgModule({
  imports: [
    CommonModule,
    OpponentFormNewComponent,
    OpponentFormNewRoutingModule,
  ],
  exports: [],
})
export class OpponentFormNewModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpponentFormRoutingModule } from './opponent-form-routing.module';
import { OpponentFormComponent } from './opponent-form.component';

@NgModule({
  imports: [CommonModule, OpponentFormComponent, OpponentFormRoutingModule],
  exports: [],
})
export class OpponentFormModule {}

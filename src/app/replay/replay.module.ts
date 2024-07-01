import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReplayComponent } from './replay.component';
import { ReplayRoutingModule } from './replay.router';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, ReplayComponent, FormsModule, ReplayRoutingModule],
  exports: [ReplayComponent],
})
export class ReplayModule {}

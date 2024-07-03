import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReplayComponent } from './replay_analyzer/replay.component';
import { ToolsRoutingModule } from './tools.router';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, ReplayComponent, FormsModule, ToolsRoutingModule],
  exports: [ReplayComponent],
})
export class ToolsModule {}

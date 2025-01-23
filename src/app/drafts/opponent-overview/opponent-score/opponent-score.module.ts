import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OpponentScoreComponent } from './opponent-score.component';
import { OpponentScoreRoutingModule } from './opponent-score-routing.module';

@NgModule({
  imports: [CommonModule, OpponentScoreComponent, OpponentScoreRoutingModule],
  exports: [],
})
export class OpponentScoreModule {}

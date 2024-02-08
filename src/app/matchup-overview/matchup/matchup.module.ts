import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatchupRoutingModule } from '../matchup-routing.module';
import { MatchupComponent } from './matchup.component';

@NgModule({
  imports: [CommonModule, MatchupComponent, MatchupRoutingModule],
  exports: [MatchupComponent],
})
export class MatchupModule {}

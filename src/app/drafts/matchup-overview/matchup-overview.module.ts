import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatchupOverviewComponent } from './matchup-overview.component';
import { MatchupRoutingModule } from './matchup-routing.module';

@NgModule({
  imports: [CommonModule, MatchupOverviewComponent, MatchupRoutingModule],
  exports: [MatchupOverviewComponent],
})
export class MatchupOverviewModule {}

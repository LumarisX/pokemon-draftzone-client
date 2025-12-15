import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatchupRoutingModule } from '../matchup-routing.module';
import { MatchupTeambuilderComponent } from './matchup-teambuilder.component';

@NgModule({
  imports: [CommonModule, MatchupTeambuilderComponent, MatchupRoutingModule],
  exports: [MatchupTeambuilderComponent],
})
export class TeamBuilderModule {}

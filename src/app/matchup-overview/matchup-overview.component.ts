import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';

@Component({
  selector: 'matchup-overview',
  standalone: true,
  template: `Matchup Private works <matchup></matchup>`,
  imports: [CommonModule, MatchupComponent, RouterModule],
})
export class MatchupOverviewComponent {
  constructor() {}
}

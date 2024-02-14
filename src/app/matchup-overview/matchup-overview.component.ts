import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';

@Component({
  selector: 'matchup-overview',
  standalone: true,
  template: `Matchup Private works
    <matchup [matchup_id]="matchupId"></matchup>`,
  imports: [CommonModule, MatchupComponent, RouterModule],
})
export class MatchupOverviewComponent implements OnInit {
  matchupId = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('id' in params) {
        this.matchupId = params['id'];
      }
    });
  }
}

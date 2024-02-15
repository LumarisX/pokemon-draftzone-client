import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';

@Component({
  selector: 'matchup-shared',
  standalone: true,
  template: `
    <div class="bg-gradient-to-r from-cyan-100 via-slate-100 to-red-100">
      <matchup [matchup_id]="matchupId"></matchup>
    </div>
  `,
  imports: [CommonModule, MatchupComponent, RouterModule],
})
export class MatchupSharedComponent implements OnInit {
  matchupId = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if ('id' in params) {
        this.matchupId = params['id'];
      }
    });
  }
}

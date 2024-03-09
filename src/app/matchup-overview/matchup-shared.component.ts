import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupService } from '../api/matchup.service';

@Component({
  selector: 'matchup-shared',
  standalone: true,
  templateUrl: 'matchup-shared.component.html',
  imports: [CommonModule, MatchupComponent, RouterModule],
})
export class MatchupSharedComponent implements OnInit {
  matchupId = '';
  matchupData: MatchupData | null = null;

  constructor(
    private route: ActivatedRoute,
    private matchupService: MatchupService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if ('id' in params) {
        this.matchupId = params['id'];
      }
      this.matchupService.getMatchup(this.matchupId).subscribe((data) => {
        this.matchupData = <MatchupData>data;
        for (let summary of this.matchupData.summery) {
          summary.team.sort((x, y) => {
            if (x['baseStats']['spe'] < y['baseStats']['spe']) {
              return 1;
            }
            if (x['baseStats']['spe'] > y['baseStats']['spe']) {
              return -1;
            }
            return 0;
          });
        }
        this.matchupData.overview = <Summary[]>JSON.parse(JSON.stringify(data));
      });
    });
  }
}

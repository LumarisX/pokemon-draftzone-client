import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupService } from '../api/matchup.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'matchup-shared',
  standalone: true,
  templateUrl: 'matchup-shared.component.html',
  imports: [CommonModule, LoadingComponent, MatchupComponent, RouterModule],
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
      this.matchupService.getSharedMatchup(this.matchupId).subscribe((data) => {
        this.matchupData = <MatchupData>data;
        for (let summary of this.matchupData.summary) {
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
        this.matchupData.overview = <Summary[]>(
          JSON.parse(JSON.stringify(this.matchupData.summary))
        );
      });
    });
  }
}

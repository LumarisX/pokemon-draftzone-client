import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupService } from '../api/matchup.service';
import { LoadingComponent } from '../loading/loading.component';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';

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
    private matchupService: MatchupService,
    private meta: Meta
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
        if (this.matchupData) {
          this.meta.updateTag({
            name: 'title',
            content: `${this.matchupData.leagueName} ${this.matchupData.stage} | ${this.matchupData.overview[0].teamName} vs ${this.matchupData.overview[1].teamName}`,
          });
          this.meta.updateTag({
            name: 'description',
            content: `View the matchup between ${this.matchupData.overview[0].teamName} and ${this.matchupData.overview[1].teamName}.`,
          });
        }
      });
    });
  }
}

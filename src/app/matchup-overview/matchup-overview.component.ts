import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupService } from '../api/matchup.service';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';

@Component({
  selector: 'matchup-overview',
  standalone: true,
  templateUrl: 'matchup-overview.component.html',
  imports: [CommonModule, MatchupComponent, RouterModule],
})
export class MatchupOverviewComponent implements OnInit {
  matchupData: MatchupData | null = null;
  matchupId = '';
  shared = false;
  copyText = 'Copy';
  shareUrl = '';
  leagueId = '';

  @ViewChild('inputFieldRef') inputFieldRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private matchupService: MatchupService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('id' in params) {
        this.matchupId = params['id'];
        this.shareUrl =
          'https://pokemondraftzone.com/matchup/' + this.matchupId;
      }
      let leagueId = this.route.snapshot.paramMap.get('teamid');
      if (leagueId) {
        this.leagueId = leagueId;
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

  share() {
    this.shared = true;
    this.copyText = 'Copy';
  }

  copyToClipboard() {
    this.copyText = 'Copied!';
    navigator.clipboard
      .writeText(this.shareUrl)
      .then(() => {
        console.log('URL copied to clipboard: ' + this.shareUrl);
      })
      .catch((error) => {
        console.error('Failed to copy URL to clipboard: ', error);
      });
  }
}

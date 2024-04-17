import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupService } from '../api/matchup.service';
import { LoadingComponent } from '../loading/loading.component';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';
import { SpriteComponent } from '../images/sprite.component';

@Component({
  selector: 'matchup-overview',
  standalone: true,
  templateUrl: 'matchup-overview.component.html',
  imports: [
    CommonModule,
    LoadingComponent,
    MatchupComponent,
    RouterModule,
    SpriteComponent,
  ],
})
export class MatchupOverviewComponent implements OnInit {
  matchupData: MatchupData | null = null;
  matchupId = '';
  shared = false;
  shareUrl = '';
  leagueId = '';

  @ViewChild('inputFieldRef') inputFieldRef!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private matchupService: MatchupService,
    private meta: Meta
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
            name: 'og:title',
            content: `${this.matchupData.leagueName} ${this.matchupData.stage} | ${this.matchupData.overview[0].teamName} vs ${this.matchupData.overview[1].teamName}`,
          });
          this.meta.updateTag({
            name: 'og:description',
            content: `View the matchup between ${this.matchupData.overview[0].teamName} and ${this.matchupData.overview[1].teamName}.`,
          });
          this.meta.updateTag({
            name: 'og:image',
            content: 'https://pokemondraftzone.com/13luken.ico',
          });
          this.meta.updateTag({
            name: 'og:url',
            content: this.shareUrl,
          });
        }
      });
    });
  }

  copyToClipboard() {
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

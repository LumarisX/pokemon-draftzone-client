import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupService } from '../api/matchup.service';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';
import { SpriteComponent } from '../images/sprite.component';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { TeraSVG } from '../images/svg-components/tera.component';
import { CopySVG } from '../images/svg-components/copy.component';
import { CloseSVG } from '../images/svg-components/close.component';
import { CheckSVG } from '../images/svg-components/score.component copy';
import { LoadingComponent } from '../images/loading/loading.component';

dayjs.extend(duration);

@Component({
  selector: 'matchup-overview',
  standalone: true,
  templateUrl: 'matchup-overview.component.html',
  imports: [
    CommonModule,
    LoadingComponent,
    MatchupComponent,
    RouterModule,
    TeraSVG,
    CopySVG,
    CloseSVG,
    CheckSVG,
    SpriteComponent,
  ],
})
export class MatchupOverviewComponent implements OnInit {
  matchupData: MatchupData | null = null;
  matchupId = '';
  shared = false;
  shareUrl = '';
  leagueId = '';
  timeString: string | null = null;
  copied = false;

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
        if ('gameTime' in this.matchupData) {
          let gameTime = dayjs(this.matchupData.gameTime);
          if (gameTime.isValid()) {
            const currentTime = dayjs();
            if (!gameTime.isBefore(currentTime)) {
              const duration = dayjs.duration(gameTime.diff(currentTime));
              const days = Math.floor(Math.abs(duration.asDays()));
              const hours = Math.abs(duration.hours());
              this.timeString =
                days > 0 ? `${days} days ${hours} hours` : `${hours} hours`;
            } else {
              this.timeString = 'Already past';
            }
          }
        }
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
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1000);
      })
      .catch((error) => {
        console.error('Failed to copy URL to clipboard: ', error);
      });
  }
}

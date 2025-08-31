import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { MatchupService } from '../../services/matchup.service';
import { LoadingComponent } from '../../images/loading/loading.component';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';
import { MatchupData } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';

dayjs.extend(duration);

@Component({
  selector: 'matchup-overview',
  standalone: true,
  templateUrl: 'matchup-overview.component.html',
  styleUrl: './matchup.scss',
  imports: [
    CommonModule,
    LoadingComponent,
    MatchupComponent,
    RouterModule,
    MatButtonModule,
    OverlayModule,
    MatIconModule,
    SpriteComponent,
  ],
})
export class MatchupOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private matchupService = inject(MatchupService);
  private meta = inject(Meta);

  matchupData: MatchupData | null = null;
  matchupId = '';
  shared = false;
  shareUrl = '';
  leagueId = '';
  timeString: string | null = null;
  copied = false;
  draftPath = DraftOverviewPath;

  @ViewChild('inputFieldRef') inputFieldRef!: ElementRef;

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
        if ('gameTime' in this.matchupData) {
          let gameTime = dayjs(this.matchupData.details.gameTime);
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
            content: `${this.matchupData.details.leagueName} ${this.matchupData.details.stage} | ${this.matchupData.summary[0].teamName} vs ${this.matchupData.summary[1].teamName}`,
          });
          this.meta.updateTag({
            name: 'og:description',
            content: `View the matchup between ${this.matchupData.summary[0].teamName} and ${this.matchupData.summary[1].teamName}.`,
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

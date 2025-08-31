import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupService } from '../../services/matchup.service';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';
import duration from 'dayjs/plugin/duration';
import dayjs from 'dayjs';
import { LoadingComponent } from '../../images/loading/loading.component';

dayjs.extend(duration);

@Component({
  selector: 'matchup-shared',
  standalone: true,
  templateUrl: 'matchup-shared.component.html',
  styleUrl: './matchup.scss',
  imports: [CommonModule, LoadingComponent, MatchupComponent, RouterModule],
})
export class MatchupSharedComponent implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private matchupService = inject(MatchupService);
  private meta = inject(Meta);

  matchupId = '';
  matchupData: MatchupData | null = null;
  timeString: string | null = null;

  ngAfterViewInit(): void {
    this.meta.updateTag({
      name: 'og:url',
      content:
        'https://pokemondraftzone.com/' + this.route.snapshot.url.join('/'),
    });
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
        this.matchupData.summary = <Summary[]>(
          JSON.parse(JSON.stringify(this.matchupData.summary))
        );
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
        }
      });
    });
  }
}

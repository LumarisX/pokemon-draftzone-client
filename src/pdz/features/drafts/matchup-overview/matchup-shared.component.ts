import { AfterViewInit, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupService } from './matchup.service';
import { MatchupData, Summary } from './matchup-interface';
import { MatchupComponent } from './matchup/matchup.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';


@Component({
  selector: 'pdz-matchup-shared',
  templateUrl: 'matchup-shared.component.html',
  styleUrl: './matchup.scss',
  imports: [LoadingComponent, MatchupComponent, RouterModule],
})
export class MatchupSharedComponent implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private matchupService = inject(MatchupService);
  private meta = inject(Meta);

  matchupId = '';
  matchupData: MatchupData | null = null;

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

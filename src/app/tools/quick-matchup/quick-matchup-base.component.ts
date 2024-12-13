import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatchupService } from '../../api/matchup.service';
import { LoadingComponent } from '../../images/loading/loading.component';
import { Pokemon } from '../../interfaces/draft';
import { MatchupData, Summary } from '../../matchup-overview/matchup-interface';
import { MatchupComponent } from '../../matchup-overview/matchup/matchup.component';
import { QuickMatchupFormComponent } from './form/quick-matchup-form.component';

@Component({
  selector: 'quick-matchup-base',
  standalone: true,
  imports: [
    CommonModule,
    QuickMatchupFormComponent,
    MatchupComponent,
    LoadingComponent,
  ],
  templateUrl: './quick-matchup-base.component.html',
})
export class QuickMatchupBaseComponent {
  matchupData?: MatchupData;
  editing: boolean = true;
  formData?: {
    format: string;
    ruleset: string;
    team1: Pokemon[];
    team2: Pokemon[];
  };

  constructor(private matchupService: MatchupService) {}

  getMatchupData(formData: {
    format: string;
    ruleset: string;
    team1: Pokemon[];
    team2: Pokemon[];
  }) {
    this.editing = false;
    this.formData = formData;
    this.matchupService.getQuickMatchup(formData).subscribe((data) => {
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
      this.matchupData!.overview = JSON.parse(
        JSON.stringify(this.matchupData!.summary),
      ) as Summary[];
    });
  }
}

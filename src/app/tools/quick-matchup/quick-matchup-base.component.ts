import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatchupService } from '../../api/matchup.service';
import { TeraType } from '../../data';
import { LoadingComponent } from '../../images/loading/loading.component';
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

  constructor(private matchupService: MatchupService) {}

  getMatchupData(formData: {
    format: string;
    ruleset: string;
    team1: {
      id: string;
      name: string;
      shiny: boolean;
      capt: { z: boolean; tera: { [key in TeraType]: boolean } };
    }[];
    team2: {
      id: string;
      name: string;
      shiny: boolean;
      capt: { z: boolean; tera: { [key in TeraType]: boolean } };
    }[];
  }) {
    this.editing = false;
    this.matchupService
      .getQuickMatchup({
        format: formData.format,
        ruleset: formData.ruleset,
        team1: formData.team1.map((data) => {
          let tera: string[] | null = Object.entries(data.capt.tera)
            .filter((e) => e[1])
            .map((e) => e[0]);
          if (tera.length < 1) tera = null;
          return {
            id: data.id,
            name: data.name,
            shiny: data.shiny,
            capt: {
              z: data.capt.z,
              tera: tera,
            },
          };
        }),
        team2: formData.team2.map((data) => {
          let tera: string[] | null = Object.entries(data.capt.tera)
            .filter((e) => e[1])
            .map((e) => e[0]);
          if (tera.length < 1) tera = null;
          return {
            id: data.id,
            name: data.name,
            shiny: data.shiny,
            capt: {
              z: data.capt.z,
              tera: tera,
            },
          };
        }),
      })
      .subscribe((data) => {
        this.matchupData = data;
        this.matchupData!.overview = JSON.parse(
          JSON.stringify(this.matchupData!.summary)
        ) as Summary[];
      });
  }
}

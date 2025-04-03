import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchupService } from '../../api/matchup.service';
import { MatchupData } from '../../drafts/matchup-overview/matchup-interface';
import { MatchupComponent } from '../../drafts/matchup-overview/matchup/matchup.component';
import { LoadingComponent } from '../../images/loading/loading.component';
import {
  QuickForm,
  QuickMatchupFormComponent,
} from './form/quick-matchup-form.component';

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
export class QuickMatchupBaseComponent implements OnInit {
  matchupData?: MatchupData;
  editing: boolean = true;
  formData?: QuickForm;

  constructor(
    private matchupService: MatchupService,
    private location: Location,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // this.route.queryParams.subscribe((params) => {
    //   {
    //     this.formData = {
    //       format: params['format'] ?? 'Singles',
    //       ruleset: params['ruleset'] ?? 'Gen9 NatDex',
    //       team1: params['team']
    //         ? Array.isArray(params['team'])
    //           ? params['team'].map((id) => ({ id: id, name: getNameByPid(id) }))
    //           : [params['team']]
    //         : [],
    //       team2: [],
    //     };
    //     this.location.replaceState(this.location.path().split('?')[0]);
    //   }
    // });
  }

  getMatchupData(formData: QuickForm) {
    this.formData = formData;
    this.matchupService
      .getQuickMatchup(formData.toValue())
      .subscribe((data) => {
        console.log('data', data);
        this.matchupData = data;
        this.editing = false;
      });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { MatchupService } from '../../drafts/matchup-overview/matchup.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { MatchupData } from '../../drafts/matchup-overview/matchup-interface';
import { MatchupComponent } from '../../drafts/matchup-overview/matchup/matchup.component';
import {
  QuickForm,
  QuickMatchupFormComponent,
} from './form/quick-matchup-form.component';

@Component({
  selector: 'pdz-quick-matchup-base',
  imports: [QuickMatchupFormComponent, MatchupComponent, LoadingComponent],
  templateUrl: './quick-matchup-base.component.html',
})
export class QuickMatchupBaseComponent implements OnInit {
  private matchupService = inject(MatchupService);

  matchupData?: MatchupData;
  editing: boolean = true;
  formData?: QuickForm;

  ngOnInit() {}

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

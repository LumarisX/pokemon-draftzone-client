import { Component, OnInit, inject } from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { MatchupData } from '../../drafts/matchup-overview/matchup-interface';
import { MatchupService } from '../../drafts/matchup-overview/matchup.service';
import { MatchupComponent } from '../../drafts/matchup-overview/matchup/matchup.component';
import {
  QuickForm,
  QuickMatchupFormComponent,
} from './form/quick-matchup-form.component';

@Component({
  selector: 'pdz-quick-matchup-base',
  imports: [
    QuickMatchupFormComponent,
    MatchupComponent,
    ButtonComponent,
    LoadingComponent,
  ],
  templateUrl: './quick-matchup-base.component.html',
  styleUrl: './quick-matchup-base.component.scss',
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

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatchupData } from '../../drafts/matchup-overview/matchup-interface';
import { MatchupComponent } from '../../drafts/matchup-overview/matchup/matchup.component';
import { LoadingComponent } from '../../images/loading/loading.component';
import { MatchupService } from '../../services/matchup.service';
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

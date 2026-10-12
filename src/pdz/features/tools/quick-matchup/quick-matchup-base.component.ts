import { Component, inject, signal } from '@angular/core';
import { MatchupData } from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { MatchupService } from '@pdz/features/drafts/matchup-overview/matchup.service';
import { MatchupBreakdownComponent } from '@pdz/features/drafts/matchup-overview/matchup/matchup-breakdown.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  QuickForm,
  QuickMatchupFormComponent,
} from './form/quick-matchup-form.component';

@Component({
  selector: 'pdz-quick-matchup-base',
  imports: [
    QuickMatchupFormComponent,
    MatchupBreakdownComponent,
    ButtonComponent,
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './quick-matchup-base.component.html',
  styleUrl: './quick-matchup-base.component.scss',
})
export class QuickMatchupBaseComponent {
  private matchupService = inject(MatchupService);

  readonly matchupData = signal<MatchupData | undefined>(undefined);
  readonly editing = signal(true);
  readonly formData = signal<QuickForm | undefined>(undefined);

  getMatchupData(formData: QuickForm) {
    this.formData.set(formData);
    this.matchupService
      .getQuickMatchup(formData.toValue())
      .subscribe((data) => {
        this.matchupData.set(data);
        this.editing.set(false);
      });
  }
}

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueAdComponent } from '../league-ad/league-ad.component';
import { LeagueAdsService, LeagueAd } from '../league-ads.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';

type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Denied';

@Component({
  selector: 'pdz-league-manage',
  templateUrl: './league-manage.component.html',
  styleUrls: ['./league-manage.component.scss'],
  imports: [FormsModule, RouterModule, IconComponent, LeagueAdComponent,
    ButtonComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
})
export class LeagueManageComponent implements OnInit {
  private leagueService = inject(LeagueAdsService);
  private destroyRef = inject(DestroyRef);

  leagues: LeagueAd[] = [];
  filteredLeagues: LeagueAd[] = [];
  currentFilter: FilterStatus = 'All';

  ngOnInit() {
    this.getLeagues();
  }

  getLeagues() {
    this.leagueService
      .getMyAds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.leagues = data;
        this.applyFilter();
      });
  }

  filterLeagues(status: FilterStatus) {
    this.currentFilter = status;
    this.applyFilter();
  }

  private applyFilter() {
    if (this.currentFilter === 'All') {
      this.filteredLeagues = this.leagues;
    } else {
      this.filteredLeagues = this.leagues.filter(
        (league) => league.status === this.currentFilter,
      );
    }
  }

  deleteLeague(_id: string) {
    this.leagueService
      .deleteAd(_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getLeagues();
      });
  }
}

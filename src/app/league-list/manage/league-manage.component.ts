import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LeagueAd, LeagueAdsService } from '../../services/league-ads.service';
import { MatIconModule } from '@angular/material/icon';
import { LeagueAdComponent } from '../league-ad/league-ad.component';

type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Denied';

@Component({
  selector: 'pdz-league-manage',
  templateUrl: './league-manage.component.html',
  styleUrls: ['./league-manage.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    LeagueAdComponent,
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

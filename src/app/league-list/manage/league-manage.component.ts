import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LeagueAd, LeagueAdsService } from '../../services/league-ads.service';
import { CoinSVG } from '../../images/svg-components/pokecoin.component';
import { BALLHEX, BallSVG } from '../../images/svg-components/ball.component';
import { PlusSVG } from '../../images/svg-components/plus.component';
import { TrashSVG } from '../../images/svg-components/trash.component';

@Component({
  selector: 'app-league-manage',
  templateUrl: './league-manage.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CoinSVG,
    BallSVG,
    PlusSVG,
    TrashSVG,
  ],
})
export class LeagueManageComponent implements OnInit {
  private leagueService = inject(LeagueAdsService);

  leagues: LeagueAd[] = [];
  filteredLeagues: LeagueAd[] = [];
  SKILLBALLS: (keyof typeof BALLHEX)[] = ['poke', 'great', 'ultra', 'master'];

  ngOnInit() {
    this.getLeagues();
  }

  getLeagues() {
    this.leagueService.getMyAds().subscribe((data) => {
      this.leagues = data;
      this.filteredLeagues = this.leagues;
    });
  }
  // Logic for filtering leagues by status
  filterLeagues(status: 'All' | 'Pending' | 'Approved' | 'Denied') {
    if (status === 'All') {
      this.filteredLeagues = this.leagues;
    } else {
      this.filteredLeagues = this.leagues.filter(
        (league) => league.status === status,
      );
    }
  }

  deleteLeague(_id: string) {
    this.leagueService.deleteAd(_id).subscribe(() => {
      this.getLeagues();
    });
  }
}

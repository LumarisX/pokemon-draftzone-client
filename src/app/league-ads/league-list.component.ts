import { Component, OnInit } from '@angular/core';
import { LeagueAd, LeagueAdsService } from '../api/league-ads.service';

@Component({
  selector: 'app-league-ad-list',
  templateUrl: './league-list.component.html',
})
export class LeagueAdListComponent implements OnInit {
  leagues: LeagueAd[] = [];
  filteredLeagues: LeagueAd[] = [];
  formats = ['Singles', 'VGC', 'Other'];
  selectedFormat = '';
  sortOption = 'createdAt';

  constructor(private leagueService: LeagueAdsService) {}

  ngOnInit() {
    this.leagueService.getLeagueAds().subscribe((data) => {
      this.leagues = data;
      this.filteredLeagues = [...this.leagues];
    });
  }

  filterLeagues() {
    this.filteredLeagues = this.leagues.filter((league) =>
      this.selectedFormat
        ? league.divisions.some((d) => d.format === this.selectedFormat)
        : true
    );
    this.sortLeagues();
  }

  sortLeagues() {
    // this.filteredLeagues.sort(
    //   (a, b) =>
    //     new Date(a[this.sortOption]).getTime() -
    //     new Date(b[this.sortOption]).getTime()
    // );
  }
}

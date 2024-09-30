import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeagueAd, LeagueAdsService } from '../api/league-ads.service';
import { LeagueAdComponent } from './league-ad/league-ad.component';
import { FilterSVG } from '../images/svg-components/filter.component';
import { PlusSVG } from '../images/svg-components/plus.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-league-ad-list',
  templateUrl: './league-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LeagueAdComponent,
    FilterSVG,
    PlusSVG,
    RouterModule,
  ],
})
export class LeagueAdListComponent implements OnInit {
  leagues: LeagueAd[] = [];
  filteredLeagues: LeagueAd[] = [];
  formats = ['Singles', 'VGC'];
  selectedFormat = '';
  sortOption:
    | 'createdAt'
    // | 'seasonStart'
    | 'closesAt' = 'createdAt';

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
    this.filteredLeagues = this.filteredLeagues.sort((a, b) =>
      a[this.sortOption] > b[this.sortOption] ? 1 : -1
    );
  }
}

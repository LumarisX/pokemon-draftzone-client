import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LeagueAd, LeagueAdsService } from '../api/league-ads.service';
import { FilterSVG } from '../images/svg-components/filter.component';
import { PlusSVG } from '../images/svg-components/plus.component';
import { LeagueAdComponent } from './league-ad/league-ad.component';
import { DataService } from '../api/data.service';

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
  formats: string[] = [];
  rulesets: string[] = [];
  sortOption:
    | 'createdAt'
    // | 'seasonStart'
    | 'closesAt' = 'createdAt';
  isFilterBoxOpen: boolean = false;
  filter = {
    format: '',
    ruleset: '',
    platform: '',
    skillLevel: '',
  };

  constructor(
    private leagueService: LeagueAdsService,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.leagueService.getLeagueAds().subscribe((data) => {
      this.leagues = data;
      this.filteredLeagues = [...this.leagues];
    });
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }

  filterLeagues() {
    // this.filteredLeagues = this.leagues.filter((league) =>
    //   this.selectedFormat
    //     ? league.divisions.some((d) => d.format === this.selectedFormat)
    //     : true
    // );
    this.sortLeagues();
  }

  sortLeagues() {
    this.filteredLeagues = this.filteredLeagues.sort((a, b) =>
      a[this.sortOption] > b[this.sortOption] ? 1 : -1
    );
  }

  // Function to toggle the filter box visibility
  toggleFilterBox(): void {
    this.isFilterBoxOpen = !this.isFilterBoxOpen;
  }

  // Optionally, you can add these methods to handle filter logic
  applyFilters(): void {
    // Logic to apply the filters
    console.log('Filters applied');
    this.toggleFilterBox(); // Close the filter box after applying filters
  }

  clearFilters(): void {
    // Logic to clear the filters
    this.filter.format = '';
    this.filter.ruleset = '';
    this.filter.platform = '';
    this.filter.skillLevel = '';
    console.log('Filters cleared');
    this.toggleFilterBox(); // Close the filter box after clearing filters
  }
}

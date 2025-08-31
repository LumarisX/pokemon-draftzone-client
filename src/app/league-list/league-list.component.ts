import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';
import { LeagueAd, LeagueAdsService } from '../services/league-ads.service';
import { FilterSVG } from '../images/svg-components/filter.component';
import { SortDownSVG } from '../images/svg-components/sort.component';
import { LeagueAdComponent } from './league-ad/league-ad.component';
import { PlusSVG } from '../images/svg-components/plus.component';
import { UnreadService } from '../services/unread.service';

@Component({
  selector: 'app-league-ad-list',
  templateUrl: './league-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LeagueAdComponent,
    FilterSVG,
    RouterModule,
    SortDownSVG,
    PlusSVG,
  ],
})
export class LeagueAdListComponent implements OnInit {
  private leagueService = inject(LeagueAdsService);
  private dataService = inject(DataService);
  private unreadService = inject(UnreadService);

  leagues: LeagueAd[] = [];
  filteredLeagues!: LeagueAd[];
  formats: string[] = [];
  rulesets: string[] = [];
  private _sortOption:
    | 'createdAt'
    // | 'seasonStart'
    | 'closesAt' = 'createdAt';
  menu: null | 'filter' | 'sort' = null;
  filter: {
    format: string;
    ruleset: string;
    platform: string;
    skillLevel: string;
  } = {
    format: '',
    ruleset: '',
    platform: '',
    skillLevel: 'any',
  };

  get sortOption() {
    return this._sortOption;
  }

  set sortOption(value) {
    this._sortOption = value;
    this.sortLeagues();
    this.menu = null;
  }

  ngOnInit() {
    this.leagueService.getLeagueAds().subscribe((data) => {
      this.leagues = data;
      this.filteredLeagues = [...this.leagues];
      localStorage.setItem('leagueTime', Date.now().toString());
      this.unreadService.leagueCount.next('');
      this.sortLeagues();
    });
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }

  filterLeagues() {
    this.filteredLeagues = this.leagues.filter((league) => {
      if (
        this.filter.format !== '' &&
        !league.divisions.some(
          (division) => division.format === this.filter.format,
        )
      )
        return false;
      if (
        this.filter.ruleset !== '' &&
        !league.divisions.some(
          (division) => division.ruleset === this.filter.ruleset,
        )
      )
        return false;
      if (
        this.filter.platform !== '' &&
        !league.divisions.some(
          (division) => division.platform === this.filter.platform,
        )
      )
        return false;
      if (
        this.filter.skillLevel !== 'any' &&
        !league.divisions.some((division) =>
          division.skillLevels.includes(+this.filter.skillLevel),
        )
      )
        return false;
      return true;
    });
    this.sortLeagues();
  }

  sortLeagues() {
    this.filteredLeagues = this.filteredLeagues.sort((a, b) =>
      a[this.sortOption] > b[this.sortOption] ? 1 : -1,
    );
  }

  toggleMenu(menu: 'filter' | 'sort'): void {
    if (this.menu === menu) this.menu = null;
    else this.menu = menu;
  }

  applyFilters(): void {
    this.filterLeagues();
    this.menu = null;
  }

  clearFilters(): void {
    this.filter.format = '';
    this.filter.ruleset = '';
    this.filter.platform = '';
    this.filter.skillLevel = 'any';
    this.applyFilters();
    this.menu = null;
  }
}

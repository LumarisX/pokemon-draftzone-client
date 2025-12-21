import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { DataService } from '../services/data.service';
import { LeagueAd, LeagueAdsService } from '../services/league-ads.service';
import { UnreadService } from '../services/unread.service';
import { LeagueAdComponent } from './league-ad/league-ad.component';

@Component({
  selector: 'app-league-ad-list',
  templateUrl: './league-list.component.html',
  styleUrls: ['./league-list.component.scss'],
  standalone: true,
  imports: [FormsModule, LeagueAdComponent, RouterModule, MatIconModule],
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
      if (this.filter.format && !league.formats.includes(this.filter.format)) {
        return false;
      }
      if (
        this.filter.ruleset &&
        !league.rulesets.includes(this.filter.ruleset)
      ) {
        return false;
      }
      if (
        this.filter.platform &&
        !league.platforms.includes(this.filter.platform)
      ) {
        return false;
      }
      if (
        this.filter.skillLevel !== 'any' &&
        !league.skillLevels.includes(Number(this.filter.skillLevel))
      ) {
        return false;
      }
      return true;
    });
    this.sortLeagues();
  }

  sortLeagues() {
    this.filteredLeagues = this.filteredLeagues.sort((a, b) =>
      a[this.sortOption] < b[this.sortOption] ? 1 : -1,
    );
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menu = null;
  }

  toggleMenu(menu: 'filter' | 'sort', event: MouseEvent): void {
    event.stopPropagation();
    this.menu = this.menu === menu ? null : menu;
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

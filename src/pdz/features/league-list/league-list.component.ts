import { Component, ElementRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '@pdz/core/services/data.service';
import { UnreadService } from '@pdz/features/pages/homepage/unread.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { forkJoin } from 'rxjs';
import { LeagueAdComponent } from './league-ad/league-ad.component';
import { LeagueAd, LeagueAdsService } from './league-ads.service';

@Component({
  selector: 'pdz--league-ad-list',
  templateUrl: './league-list.component.html',
  styleUrls: ['./league-list.component.scss'],
  imports: [
    FormsModule,
    LeagueAdComponent,
    RouterModule,
    ButtonComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class LeagueAdListComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private leagueService = inject(LeagueAdsService);
  private dataService = inject(DataService);
  private unreadService = inject(UnreadService);

  leagues: LeagueAd[] = [];
  filteredLeagues: LeagueAd[] = [];
  formats: string[] = [];
  rulesets: string[] = [];
  private _sortOption: 'createdAt' | 'closesAt' = 'createdAt';
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
    forkJoin([
      this.leagueService.getLeagueAds(),
      this.leagueService.getHostedLeagueAds(),
    ]).subscribe(([external, hosted]) => {
      this.leagues = [...hosted, ...external];
      this.filteredLeagues = [...this.leagues];
      this.unreadService.markLeaguesRead();
      this.sortLeagues();
    });
    this.dataService.getFormatsLegacy().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesetsLegacy().subscribe((rulesets) => {
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

  onDocumentClick(event: MouseEvent): void {
    const controls = this.host.nativeElement.querySelector('.toolbar__controls');
    if (controls?.contains(event.target as Node)) return;
    this.menu = null;
  }

  toggleMenu(menu: 'filter' | 'sort'): void {
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

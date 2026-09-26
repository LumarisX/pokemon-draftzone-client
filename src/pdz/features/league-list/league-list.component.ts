import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { AuthService } from '@pdz/core/services/auth0.service';
import { DataService } from '@pdz/core/services/data.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { UnreadService } from '@pdz/features/pages/homepage/unread.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { catchError, EMPTY, filter, forkJoin, switchMap } from 'rxjs';
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
    IconComponent,
    ButtonComponent,
    CardComponent,
    PageHeaderComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
})
export class LeagueAdListComponent implements OnInit {
  private leagueService = inject(LeagueAdsService);
  private leagueZoneService = inject(LeagueZoneService);
  private auth = inject(AuthService);
  private dataService = inject(DataService);
  private unreadService = inject(UnreadService);
  private destroyRef = inject(DestroyRef);

  protected readonly leagueZonePath = LEAGUE_ZONE_PATH;
  protected readonly newLeagueLink = ['/', LEAGUE_ZONE_PATH, 'new'];
  protected readonly canCreateLeague = signal(false);
  protected readonly ownedLeagues = signal<League.OwnedLeague[]>([]);

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
    this.auth.isAuthenticated$
      .pipe(
        filter(Boolean),
        switchMap(() =>
          forkJoin([
            this.leagueZoneService.getLeagueCapabilities(),
            this.leagueZoneService.getOwnedLeagues(),
          ]).pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([capabilities, owned]) => {
        this.canCreateLeague.set(capabilities.canCreateLeague);
        this.ownedLeagues.set(owned.leagues);
      });

    forkJoin([
      this.leagueService.getLeagueAds(),
      this.leagueService.getHostedLeagueAds(),
    ]).subscribe(([external, hosted]) => {
      this.leagues = [...hosted, ...external];
      this.filteredLeagues = [...this.leagues];
      localStorage.setItem('leagueTime', Date.now().toString());
      this.unreadService.leagueCount.next('');
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

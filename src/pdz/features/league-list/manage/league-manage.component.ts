import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LeagueAdComponent } from '@pdz/features/league-list/league-ad/league-ad.component';
import {
  LeagueAd,
  LeagueAdsService,
} from '@pdz/features/league-list/league-ads.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';

type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Denied';

@Component({
  selector: 'pdz-league-manage',
  templateUrl: './league-manage.component.html',
  styleUrl: './league-manage.component.scss',
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    LeagueAdComponent,
    PageHeaderComponent,
    RouterLink,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueManageComponent {
  private readonly leagueService = inject(LeagueAdsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly leagues = signal<LeagueAd[]>([]);
  readonly filter = signal<FilterStatus>('All');

  readonly filteredLeagues = computed(() => {
    const filter = this.filter();
    const leagues = this.leagues();
    return filter === 'All'
      ? leagues
      : leagues.filter((league) => league.status === filter);
  });

  constructor() {
    this.load();
  }

  deleteLeague(id: string): void {
    this.leagueService
      .deleteAd(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  private load(): void {
    this.leagueService
      .getMyAds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.leagues.set(data));
  }
}

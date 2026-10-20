import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { PodiumComponent } from '@pdz/shared/data/podium/podium.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { getLeagueLogoUrl } from '../league.util';
import { podiumPlaces, seasonLabel } from './final-placements';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; hall: League.HallOfFame };

@Component({
  selector: 'pdz-hall-of-fame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    PodiumComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './hall-of-fame.component.html',
  styleUrl: './hall-of-fame.component.scss',
})
export class HallOfFameComponent {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly leagueSlug =
    inject(ActivatedRoute).snapshot.paramMap.get('leagueSlug') ?? '';

  protected readonly leagueLink = ['/', LEAGUE_ZONE_PATH, this.leagueSlug];
  protected readonly state = signal<State>({ status: 'loading' });

  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });

  protected readonly hall = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.hall : null;
  });

  protected readonly logo = computed(() =>
    getLeagueLogoUrl(this.hall()?.logo ?? undefined),
  );

  protected readonly seasons = computed(() =>
    (this.hall()?.seasons ?? []).map((season) => {
      const base = [
        ...this.leagueLink,
        'tournaments',
        season.tournamentSlug,
      ];
      return {
        season,
        link: base,
        meta: [season.format, season.ruleset, seasonLabel(season)]
          .filter(Boolean)
          .join(' · '),
        places: podiumPlaces(season.places, (teamSlug) => [
          ...base,
          'teams',
          teamSlug,
        ]),
      };
    }),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set({ status: 'loading' });
    this.leagueService
      .getHallOfFame(this.leagueSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (hall) => this.state.set({ status: 'ready', hall }),
        error: (err) =>
          this.state.set({
            status: 'error',
            message: apiErrorMessage(err, 'The Hall of Fame did not load.'),
          }),
      });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  LEAGUE_HALL_OF_FAME_PATH,
  LEAGUE_ZONE_PATH,
} from '@pdz/core/route-paths';
import {
  AchievementBadgeComponent,
  RARITY_ORDER,
} from '@pdz/shared/data/achievement/achievement-badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { MeterComponent } from '@pdz/shared/data/meter/meter.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: League.TeamAchievements };

function rank(entry: League.AchievementProgress): number {
  return entry.rarity ? RARITY_ORDER.indexOf(entry.rarity) : -1;
}

function share(entry: League.AchievementProgress): number {
  return entry.next ? entry.count / entry.next : 0;
}

@Component({
  selector: 'pdz-team-achievements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AchievementBadgeComponent,
    CardComponent,
    EmptyStateComponent,
    MeterComponent,
    SkeletonLayoutComponent,
    TooltipDirective,
  ],
  templateUrl: './team-achievements.component.html',
  styleUrl: './team-achievements.component.scss',
})
export class TeamAchievementsComponent {
  private readonly leagueService = inject(LeagueZoneService);

  readonly teamSlug = input.required<string>();

  private readonly reload = signal(0);

  protected readonly state = signal<State>({ status: 'loading' });

  protected readonly hallOfFameLink = computed(() => [
    '/',
    LEAGUE_ZONE_PATH,
    this.leagueService.leagueSlug() ?? '',
    LEAGUE_HALL_OF_FAME_PATH,
  ]);

  protected readonly data = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data : null;
  });

  private readonly shown = computed(
    () =>
      this.data()?.achievements.filter(
        (entry) => entry.rarity || !entry.hidden,
      ) ?? [],
  );

  protected readonly rows = computed(() => {
    const data = this.data();
    if (!data) return [];
    return [...this.shown()]
      .filter((entry) => !data.final || entry.rarity)
      .sort(
        (a, b) =>
          rank(b) - rank(a) ||
          share(b) - share(a) ||
          (a.earnedAt ?? '').localeCompare(b.earnedAt ?? ''),
      )
      .map((entry) => {
        const target = entry.next ?? entry.tiers.at(-1)!.count;
        const targetTier =
          entry.tiers.find((tier) => tier.count === target) ??
          entry.tiers.at(-1)!;
        const progress =
          !data.final && entry.next !== null && entry.count > 0
            ? { value: Math.min(entry.count, entry.next), max: entry.next }
            : null;
        return {
          entry,
          progress,
          tooltip: progress
            ? `${targetTier.hint}\n${progress.value} / ${progress.max}`
            : targetTier.hint,
        };
      });
  });

  protected readonly earnedCount = computed(
    () => this.shown().filter((entry) => entry.rarity).length,
  );

  protected readonly total = computed(() => this.shown().length);

  constructor() {
    toObservable(computed(() => ({ slug: this.teamSlug(), tick: this.reload() })))
      .pipe(
        switchMap(({ slug }) =>
          this.leagueService.getTeamAchievements(slug).pipe(
            map((data): State => ({ status: 'ready', data })),
            catchError(() => of<State>({ status: 'error' })),
            startWith<State>({ status: 'loading' }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.state.set(state));
  }

  protected retry(): void {
    this.reload.update((tick) => tick + 1);
  }
}

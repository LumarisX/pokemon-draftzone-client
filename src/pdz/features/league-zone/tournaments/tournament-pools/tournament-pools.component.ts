import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import {
  formatCountdown,
  getTeamLogoSrc,
} from '@pdz/features/league-zone/league.util';
import {
  formatMilestoneTime,
  waitingMessage,
} from '@pdz/features/league-zone/tournament-milestones';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { MeterComponent } from '@pdz/shared/data/meter/meter.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import { catchError, debounceTime, interval, merge, of } from 'rxjs';

const STATUS_LABELS: Record<League.PoolStatus, string> = {
  PRE_DRAFT: 'Pre-Draft',
  IN_PROGRESS: 'Live',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
};

const STATUS_TONES: Record<League.PoolStatus, ChipTone> = {
  PRE_DRAFT: 'info',
  IN_PROGRESS: 'success',
  PAUSED: 'warning',
  COMPLETED: 'neutral',
};

const STATUS_ORDER: Record<League.PoolStatus, number> = {
  IN_PROGRESS: 0,
  PAUSED: 1,
  PRE_DRAFT: 2,
  COMPLETED: 3,
};

const DRAFT_EVENTS = [
  'league.draft.added',
  'league.draft.updated',
  'league.draft.counter',
  'league.draft.status',
  'league.draft.completed',
  'league.draft.skip',
];

type PoolCard = {
  pool: League.PoolOverview;
  live: boolean;
  statusLabel: string;
  statusTone: ChipTone;
  when: string | null;
  startsAt: string | null;
  clock: {
    name: string;
    logo?: string;
    yours: boolean;
    timer: string | null;
  } | null;
  turnLine: string | null;
  stats: { label: string; value: string }[];
  picks: {
    key: string;
    pokemon: { id: string; name: string };
    teamName: string;
    round: number;
    timestamp: string;
  }[];
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(Math.round(seconds), 1)}s`;
  return formatCountdown(seconds * 1000).replace(/ 0[smh]$/, '');
}

@Component({
  selector: 'pdz-tournament-pools',
  templateUrl: './tournament-pools.component.html',
  styleUrl: './tournament-pools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    CardComponent,
    ChipComponent,
    MeterComponent,
    PokemonComponent,
    TeamComponent,
    CountdownComponent,
    EmptyStateComponent,
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
  ],
})
export class TournamentPoolsComponent {
  private leagueService = inject(LeagueZoneService);
  private eventStream = inject(EventStreamService);
  private destroyRef = inject(DestroyRef);

  readonly leagueInfo = toSignal(
    this.leagueService.getLeagueInfo().pipe(catchError(() => of(null))),
  );

  readonly pools = signal<League.PoolOverview[] | null | undefined>(undefined);
  private readonly now = signal(Date.now());

  readonly noPoolsMessage = computed(() =>
    waitingMessage(
      'The organizers set up pools before the draft.',
      this.leagueInfo(),
    ),
  );

  readonly cards = computed<PoolCard[]>(() => {
    const now = this.now();
    return [...(this.pools() ?? [])]
      .sort(
        (a, b) =>
          Number(!!b.yourTeam) - Number(!!a.yourTeam) ||
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      )
      .map((pool) => this.toCard(pool, now));
  });

  constructor() {
    this.load();

    merge(...DRAFT_EVENTS.map((event) => this.eventStream.on(event)))
      .pipe(debounceTime(500), takeUntilDestroyed())
      .subscribe(() => this.refresh());

    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.now.set(Date.now()));
  }

  load(): void {
    this.pools.set(undefined);
    this.refresh();
  }

  private refresh(): void {
    this.leagueService
      .getDraftOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ pools }) => this.pools.set(pools),
        error: () => {
          if (this.pools() === undefined) this.pools.set(null);
        },
      });
  }

  private toCard(pool: League.PoolOverview, now: number): PoolCard {
    const live = pool.status === 'IN_PROGRESS' || pool.status === 'PAUSED';
    const startsAt =
      pool.status === 'PRE_DRAFT' &&
      pool.draftStart &&
      new Date(pool.draftStart).getTime() > now
        ? pool.draftStart
        : null;
    return {
      pool,
      live,
      statusLabel: STATUS_LABELS[pool.status],
      statusTone: STATUS_TONES[pool.status],
      when: this.when(pool, startsAt),
      startsAt,
      clock: live ? this.clock(pool, now) : null,
      turnLine: this.turnLine(pool),
      stats: this.stats(pool),
      picks: pool.recentPicks.map((pick) => ({
        key: `${pick.pokemon.id}-${pick.team.id}-${pick.round}`,
        pokemon: pick.pokemon,
        teamName: pick.team.name,
        round: pick.round + 1,
        timestamp: pick.timestamp,
      })),
    };
  }

  private when(
    pool: League.PoolOverview,
    startsAt: string | null,
  ): string | null {
    if (pool.status === 'PRE_DRAFT') {
      if (startsAt) return `Starts ${formatMilestoneTime(new Date(startsAt))}`;
      return pool.draftStart
        ? 'Waiting on the organizers to start'
        : 'Start time not set';
    }
    if (pool.status === 'COMPLETED' && pool.completedAt)
      return new Date(pool.completedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    return null;
  }

  private clock(pool: League.PoolOverview, now: number): PoolCard['clock'] {
    const team = pool.onTheClock;
    if (!team) return null;
    let timer: string | null = null;
    if (pool.status === 'PAUSED') timer = 'Paused';
    else if (pool.noTimer) timer = 'No timer';
    else if (pool.skipTime) {
      const left = new Date(pool.skipTime).getTime() - now;
      timer = left > 0 ? formatCountdown(left) : 'Time up';
    }
    return {
      name: team.name,
      logo: getTeamLogoSrc(team.logo),
      yours: !!pool.yourTeam && pool.yourTeam.id === team.id,
      timer,
    };
  }

  private turnLine(pool: League.PoolOverview): string | null {
    if (pool.status !== 'IN_PROGRESS' || pool.yourPickIn === undefined)
      return null;
    if (pool.onTheClock && pool.onTheClock.id === pool.yourTeam?.id)
      return null;
    if (pool.yourPickIn === 0) return 'You can pick now';
    if (pool.yourPickIn === 1) return "You're up next";
    return `Your turn in ${pool.yourPickIn} picks`;
  }

  private stats(pool: League.PoolOverview): PoolCard['stats'] {
    const stats = [{ label: 'Teams', value: String(pool.teamCount) }];
    if (pool.status === 'PRE_DRAFT') return stats;
    stats.push({
      label: 'Snipes',
      value: pool.pace.snipes === undefined ? '—' : String(pool.pace.snipes),
    });
    if (pool.pace.medianPickSeconds !== undefined)
      stats.push({
        label: 'Median Pick',
        value: formatDuration(pool.pace.medianPickSeconds),
      });
    return stats;
  }
}

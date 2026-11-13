import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  LEAGUE_ADS_PATH,
  PLANNER_PATH,
  PROFILE_PATH,
  TIER_LIST_PATH,
} from '@pdz/core/route-paths';
import { EXTERNAL_DRAFTS_AREA } from '@pdz/features/drafts/draft-area';
import {
  getLeagueLogoUrl,
  getTeamLogoSrc,
} from '@pdz/features/league-zone/league.util';
import {
  PlannerSyncService,
  SavedPlanner,
} from '@pdz/features/planner/planner-sync.service';
import {
  TierListService,
  TierListSummary,
} from '@pdz/features/tier-lists/tier-list.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  Dashboard,
  leagueLink,
  PHASE_LABEL,
  tournamentLink,
} from './dashboard.model';
import { DashboardService } from './dashboard.service';
import { DashboardRowComponent } from './row/dashboard-row.component';
import { DashboardSectionComponent } from './section/dashboard-section.component';
import { DashboardTeamCardComponent } from './team-card/dashboard-team-card.component';
import { DashboardUpNextComponent } from './up-next/dashboard-up-next.component';

const TIER_LIST_LIMIT = 5;

@Component({
  selector: 'pdz-dashboard',
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    DashboardRowComponent,
    DashboardSectionComponent,
    DashboardTeamCardComponent,
    DashboardUpNextComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly tierListService = inject(TierListService);
  private readonly plannerSync = inject(PlannerSyncService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly plannerLink = ['/', PLANNER_PATH];
  protected readonly findLink = ['/', LEAGUE_ADS_PATH];
  protected readonly addLink = [...EXTERNAL_DRAFTS_AREA.root, 'new'];
  protected readonly tierListsLink = ['/', TIER_LIST_PATH, 'mine'];
  protected readonly profileLink = ['/', PROFILE_PATH];

  protected readonly dashboard = signal<Dashboard | null>(null);
  protected readonly failed = signal(false);
  protected readonly tierLists = signal<TierListSummary[] | null>(null);
  protected readonly tierListsFailed = signal(false);
  protected readonly planners = signal<SavedPlanner[] | null>(null);
  protected readonly plannersFailed = signal(false);

  protected readonly organizing = computed(() =>
    (this.dashboard()?.organizing ?? []).map((tournament) => ({
      id: `${tournament.leagueSlug}/${tournament.tournamentSlug}`,
      name: tournament.tournamentName,
      meta: `${tournament.leagueName} · ${tournament.owner ? 'Owner' : 'Organizer'}`,
      status: PHASE_LABEL[tournament.phase],
      logo: getTeamLogoSrc(tournament.logo),
      link: tournamentLink(tournament.leagueSlug, tournament.tournamentSlug),
    })),
  );

  protected readonly leagues = computed(() =>
    (this.dashboard()?.leagues ?? []).map((league) => ({
      id: league.leagueSlug,
      name: league.name,
      meta: league.role === 'owner' ? 'Owner' : 'Admin',
      logo: getLeagueLogoUrl(league.logo),
      link: leagueLink(league.leagueSlug),
      newTournament: league.canCreateTournament
        ? [...leagueLink(league.leagueSlug), 'tournaments', 'new']
        : null,
    })),
  );

  protected readonly lists = computed(() =>
    (this.tierLists() ?? []).map((list) => ({
      id: list.id,
      name: list.name,
      meta: `${list.format} · ${list.ruleset}`,
      link: ['/', TIER_LIST_PATH, list.slug],
    })),
  );

  protected readonly plans = computed(() =>
    (this.planners() ?? []).map((planner) => {
      const tournament = planner.tournament;
      const names = planner.plans.map((plan) => plan.name || 'Untitled');
      return {
        id: planner.key,
        name: tournament
          ? (tournament.name ?? 'Tournament Planner')
          : 'Free Planner',
        meta: names.join(', '),
        status: `${names.length} ${names.length === 1 ? 'plan' : 'plans'}`,
        link: tournament
          ? [
              ...tournamentLink(
                tournament.leagueSlug,
                tournament.tournamentSlug,
              ),
              PLANNER_PATH,
            ]
          : ['/', PLANNER_PATH],
      };
    }),
  );

  protected readonly isEmpty = computed(() => {
    const data = this.dashboard();
    return (
      !!data &&
      !data.teams.length &&
      !data.organizing.length &&
      !data.leagues.length &&
      !data.completedCount
    );
  });

  protected readonly hasSide = computed(
    () =>
      this.organizing().length > 0 ||
      this.leagues().length > 0 ||
      this.tierListsFailed() ||
      this.lists().length > 0 ||
      this.plannersFailed() ||
      this.plans().length > 0,
  );

  constructor() {
    this.load();
    this.loadTierLists();
    this.loadPlanners();
  }

  protected loadPlanners(): void {
    this.plannersFailed.set(false);
    this.planners.set(null);
    this.plannerSync
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (planners) => this.planners.set(planners),
        error: () => this.plannersFailed.set(true),
      });
  }

  protected load(): void {
    this.failed.set(false);
    this.dashboard.set(null);
    this.dashboardService
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard) => this.dashboard.set(dashboard),
        error: () => this.failed.set(true),
      });
  }

  protected loadTierLists(): void {
    this.tierListsFailed.set(false);
    this.tierLists.set(null);
    this.tierListService
      .browse({ scope: 'mine', limit: TIER_LIST_LIMIT })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.tierLists.set(result.tierLists),
        error: () => this.tierListsFailed.set(true),
      });
  }
}

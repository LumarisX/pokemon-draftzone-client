import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { podiumPlaces } from '@pdz/features/league-zone/hall-of-fame/final-placements';
import { AuthService } from '@pdz/core/services/auth0.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import {
  StageSwitcherComponent,
  StageSwitcherOption,
} from '@pdz/features/league-zone/league-widgets/stage-switcher/stage-switcher.component';
import {
  PodiumComponent,
  PodiumPlace,
} from '@pdz/shared/data/podium/podium.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, map, of, switchMap } from 'rxjs';
import { FinalStandingsComponent } from './final-standings/final-standings.component';
import { PokemonStandingsComponent } from './pokemon-standings/pokemon-standings.component';
import { TeamStandingsComponent } from './team-standings/team-standings.component';

const FINAL_VIEW = 'final';

type StandingsState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      filters: League.StandingsFilter[];
      views: Record<string, League.StandingsView>;
    };

@Component({
  selector: 'pdz-league-standings',
  imports: [
    EmptyStateComponent,
    FinalStandingsComponent,
    PageComponent,
    PageHeaderComponent,
    PodiumComponent,
    PokemonStandingsComponent,
    SkeletonComponent,
    StageSwitcherComponent,
    TeamStandingsComponent,
  ],
  templateUrl: './league-standings.component.html',
  styleUrl: './league-standings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueStandingsComponent {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly auth = inject(AuthService);

  readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  readonly pokemonFilter = signal('all');

  readonly state = toSignal(
    this.leagueService.getStandings().pipe(
      map(
        (data): StandingsState => ({
          status: 'ready',
          filters: data.filters,
          views: data.views,
        }),
      ),
      catchError(() => of<StandingsState>({ status: 'error' })),
    ),
    { initialValue: { status: 'loading' } as StandingsState },
  );

  private readonly profile = toSignal(
    this.auth.isAuthenticated$.pipe(
      switchMap((isAuthenticated) =>
        isAuthenticated
          ? this.leagueService
              .getCoachData({ suppressStatuses: [404] })
              .pipe(catchError(() => of(null)))
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  readonly ownTeamId = computed(() => this.profile()?.teamId ?? null);

  readonly ownTeamSlug = computed(() => {
    const ownTeamId = this.ownTeamId();
    const state = this.state();
    if (!ownTeamId || state.status !== 'ready') return null;
    for (const view of Object.values(state.views)) {
      const team = view.teamStandings.teams.find(
        (entry) => entry.id === ownTeamId,
      );
      if (team?.teamSlug) return team.teamSlug;
    }
    return null;
  });

  readonly teamLinkBase = computed(() => {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    if (!leagueSlug || !tournamentSlug) return null;
    return [
      '/',
      LEAGUE_ZONE_PATH,
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'teams',
    ];
  });

  readonly showSwitchers = computed(() => {
    const state = this.state();
    return state.status === 'ready' && state.filters.length > 1;
  });

  readonly info = toSignal(
    this.leagueService.getLeagueInfo().pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  readonly finalPlacements = toSignal(
    toObservable(this.info).pipe(
      switchMap((info) =>
        info?.completedAt
          ? this.leagueService
              .getFinalPlacements(info.tournamentSlug)
              .pipe(catchError(() => of(null)))
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  private readonly hasFinal = computed(
    () => !!this.finalPlacements()?.length,
  );

  readonly teamFilter = linkedSignal<string>(() =>
    this.hasFinal() ? FINAL_VIEW : 'all',
  );

  readonly showFinal = computed(
    () => this.hasFinal() && this.teamFilter() === FINAL_VIEW,
  );

  readonly finalOptions = computed((): StageSwitcherOption[] =>
    this.hasFinal() ? [{ value: FINAL_VIEW, label: 'Final' }] : [],
  );

  readonly showTeamSwitcher = computed(
    () => this.showSwitchers() || this.hasFinal(),
  );

  readonly teamStandings = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') return null;
    const table = state.views[this.teamFilter()]?.teamStandings;
    return table?.teams.length ? table : null;
  });

  readonly podium = computed((): PodiumPlace[] => {
    const final = this.finalPlacements();
    if (!final?.length) return [];
    const linkBase = this.teamLinkBase();
    return podiumPlaces(final, (teamSlug) =>
      linkBase ? [...linkBase, teamSlug] : [],
    );
  });

  readonly pokemonStandings = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') return [];
    return state.views[this.pokemonFilter()]?.pokemonStandings ?? [];
  });
}

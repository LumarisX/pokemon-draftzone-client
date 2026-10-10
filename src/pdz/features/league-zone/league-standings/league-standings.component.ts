import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { AuthService } from '@pdz/core/services/auth0.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { Pokemon } from '@pdz/core/utils/pokemon';
import {
  PODIUM_SIZE,
  PodiumComponent,
  PodiumPlace,
} from '@pdz/shared/data/podium/podium.component';
import { StageSwitcherComponent } from '@pdz/features/league-zone/league-widgets/stage-switcher/stage-switcher.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { catchError, map, of, switchMap } from 'rxjs';
import { PokemonStandingsComponent } from './pokemon-standings/pokemon-standings.component';
import { TeamStandingsComponent } from './team-standings/team-standings.component';

function topScorer(
  standings: League.PokemonStanding[],
  teamName: string,
): Pokemon | null {
  const best = standings
    .filter((p) => p.teamName === teamName && p.record.kills > 0)
    .sort(
      (a, b) =>
        b.record.kills - a.record.kills ||
        a.record.deaths - b.record.deaths ||
        a.record.brought - b.record.brought,
    )[0];
  return best ? { id: best.id, name: best.name } : null;
}

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

  readonly teamFilter = signal('all');
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

  readonly teamStandings = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') return null;
    return state.views[this.teamFilter()]?.teamStandings ?? null;
  });

  private readonly info = toSignal(
    this.leagueService.getLeagueInfo().pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  readonly podium = computed((): PodiumPlace[] => {
    const state = this.state();
    const seasonEnd = this.info()?.seasonEnd;
    if (state.status !== 'ready' || !seasonEnd) return [];
    if (Date.now() <= new Date(seasonEnd).getTime()) return [];
    const view = state.views['all'] ?? Object.values(state.views)[0];
    if (!view) return [];
    const played = view.teamStandings.teams.filter(
      (team) => team.wins + team.losses + (team.draws ?? 0) > 0,
    );
    if (played.length < 2) return [];
    const linkBase = this.teamLinkBase();
    const ownTeamId = this.ownTeamId();
    return played.slice(0, PODIUM_SIZE).map((team) => ({
      name: team.name,
      logo: getTeamLogoSrc(team.logo),
      coach: team.coach,
      wins: team.wins,
      losses: team.losses,
      draws: team.draws,
      pokemon: topScorer(view.pokemonStandings, team.name),
      link: linkBase && team.teamSlug ? [...linkBase, team.teamSlug] : null,
      you: team.id === ownTeamId,
    }));
  });

  readonly pokemonStandings = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') return [];
    return state.views[this.pokemonFilter()]?.pokemonStandings ?? [];
  });
}

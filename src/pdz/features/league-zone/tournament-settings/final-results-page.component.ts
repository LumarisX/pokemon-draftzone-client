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
import {
  LEAGUE_HALL_OF_FAME_PATH,
  LEAGUE_ZONE_PATH,
} from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { PodiumComponent } from '@pdz/shared/data/podium/podium.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { podiumPlaces } from '../hall-of-fame/final-placements';
import { LeagueManageService } from '../league-manage/league-manage.service';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { getTeamLogoSrc } from '../league.util';
import { formatMilestoneTime } from '../tournament-milestones';
import { TournamentSettingsStore } from './tournament-settings.store';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; results: League.FinalResults };

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

@Component({
  selector: 'pdz-final-results-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    EmptyStateComponent,
    IconComponent,
    PageComponent,
    PageHeaderComponent,
    PodiumComponent,
    PokemonComponent,
    RecordComponent,
    SkeletonLayoutComponent,
    TeamComponent,
  ],
  templateUrl: './final-results-page.component.html',
  styleUrl: './final-results-page.component.scss',
})
export class FinalResultsPageComponent {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly manage = inject(LeagueManageService);
  private readonly league = inject(LeagueZoneService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<State>({ status: 'loading' });

  protected readonly results = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.results : null;
  });

  protected readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : '';
  });

  protected readonly completed = computed(
    () => !!this.results()?.completedAt || this.store.saved().completed,
  );

  protected readonly completedOn = computed(() => {
    const at = this.results()?.completedAt;
    return at ? formatMilestoneTime(new Date(at)) : null;
  });

  private readonly tournamentBase = computed(() => [
    '/',
    LEAGUE_ZONE_PATH,
    this.league.leagueSlug() ?? '',
    'tournaments',
    this.league.tournamentSlug() ?? '',
  ]);

  protected readonly hallOfFameLink = computed(() => [
    '/',
    LEAGUE_ZONE_PATH,
    this.league.leagueSlug() ?? '',
    LEAGUE_HALL_OF_FAME_PATH,
  ]);

  protected readonly rows = computed(() =>
    (this.results()?.results ?? []).map((row) => ({
      ...row,
      logoSrc: getTeamLogoSrc(row.logo),
      link: [...this.tournamentBase(), 'teams', row.teamSlug],
    })),
  );

  protected readonly places = computed(() =>
    podiumPlaces(this.results()?.results ?? [], (teamSlug) => [
      ...this.tournamentBase(),
      'teams',
      teamSlug,
    ]),
  );

  protected readonly warnings = computed(() => {
    const results = this.results();
    if (!results) return [];
    const warnings: string[] = [];
    if (results.pendingReports)
      warnings.push(
        `${plural(results.pendingReports, 'report is', 'reports are')} still waiting for your approval.`,
      );
    if (results.unplayed)
      warnings.push(
        `${plural(results.unplayed, 'match has', 'matches have')} no result yet.`,
      );
    return warnings;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set({ status: 'loading' });
    this.manage
      .getFinalResults()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => this.state.set({ status: 'ready', results }),
        error: (err) =>
          this.state.set({
            status: 'error',
            message: apiErrorMessage(err, 'The final results did not load.'),
          }),
      });
  }

  protected async complete(): Promise<void> {
    const warnings = this.warnings();
    if (warnings.length) {
      const confirmed = await this.dialog.confirm('Complete with matches open?', {
        message: `${warnings.join(' ')} They won't count toward the final placements.`,
        confirmLabel: 'Complete Anyway',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
    }
    this.store.setCompleted(true).subscribe({
      next: () => {
        this.toast.success('Tournament completed. Its champions are in the Hall of Fame.');
        this.load();
      },
      error: () =>
        this.toast.error(this.store.saveError() ?? 'Could not complete the tournament.'),
    });
  }

  protected async reopen(): Promise<void> {
    const confirmed = await this.dialog.confirm('Reopen this tournament?', {
      message:
        'Its placements come out of the Hall of Fame and results and settings unlock. Completing it again records the placements fresh.',
      confirmLabel: 'Reopen',
      confirmColor: 'danger',
    });
    if (!confirmed) return;
    this.store.setCompleted(false).subscribe({
      next: () => {
        this.toast.success('Tournament reopened.');
        this.load();
      },
      error: () =>
        this.toast.error(this.store.saveError() ?? 'Could not reopen the tournament.'),
    });
  }
}

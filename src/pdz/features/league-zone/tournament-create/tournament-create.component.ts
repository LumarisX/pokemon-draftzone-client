import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LEAGUE_ZONE_MANAGE_PATH,
  LEAGUE_ZONE_PATH,
  tournamentRoute,
} from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { isValidOrganizerName, ORGANIZER_NAME_MAX } from '../league.util';

export const TOURNAMENT_NAME_MAX = 80;

type DiffMode = 'pokemon' | 'game';

@Component({
  selector: 'pdz-tournament-create',
  templateUrl: './tournament-create.component.html',
  styleUrl: './tournament-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SlideToggleComponent,
  ],
})
export class TournamentCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leagueService = inject(LeagueZoneService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly leagueSlug =
    this.route.snapshot.paramMap.get('leagueSlug') ?? '';
  protected readonly leagueLink = ['/', LEAGUE_ZONE_PATH, this.leagueSlug];

  protected readonly league = signal<League.LeagueSummary | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);

  protected readonly name = signal('');
  protected readonly ownerName = signal('');
  protected readonly signUpDeadline = signal('');
  protected readonly copySettings = signal(false);
  protected readonly diffMode = signal<DiffMode>('pokemon');
  protected readonly draftMin = signal(10);
  protected readonly draftMax = signal(12);

  protected readonly nameMax = TOURNAMENT_NAME_MAX;
  protected readonly ownerNameMax = ORGANIZER_NAME_MAX;

  protected readonly copySource = computed(
    () => this.league()?.newTournamentDefaults?.copyFrom ?? null,
  );

  protected readonly ownerNameValid = computed(() =>
    isValidOrganizerName(this.ownerName()),
  );

  protected readonly draftCountValid = computed(
    () =>
      Number.isInteger(this.draftMin()) &&
      Number.isInteger(this.draftMax()) &&
      this.draftMin() >= 0 &&
      this.draftMin() <= this.draftMax(),
  );

  protected readonly canSubmit = computed(
    () =>
      !this.saving() &&
      this.name().trim().length > 0 &&
      this.ownerNameValid() &&
      this.signUpDeadline().length > 0 &&
      (this.copySettings() || this.draftCountValid()),
  );

  ngOnInit(): void {
    this.leagueService
      .getLeague(this.leagueSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (league) => {
          this.ownerName.set(league.newTournamentDefaults?.ownerName ?? '');
          this.league.set(league);
        },
        error: () => this.loadFailed.set(true),
      });
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.saving.set(true);

    const copyFrom = this.copySettings()
      ? this.copySource()?.tournamentSlug
      : undefined;

    this.leagueService
      .createTournament(this.leagueSlug, {
        name: this.name().trim(),
        ownerName: this.ownerName().trim(),
        signUpDeadline: new Date(this.signUpDeadline()).toISOString(),
        ...(copyFrom
          ? { copyFrom }
          : {
              diffMode: this.diffMode(),
              draftCount: { min: this.draftMin(), max: this.draftMax() },
            }),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ tournamentSlug }) => {
          this.toast.success(
            'Tournament created. Sign-ups stay closed until you open them.',
          );
          this.router.navigate([
            ...tournamentRoute(tournamentSlug),
            LEAGUE_ZONE_MANAGE_PATH,
          ]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(
            err?.error?.error?.message ?? 'Could not create the tournament.',
          );
        },
      });
  }
}

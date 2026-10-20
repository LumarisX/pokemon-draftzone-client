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
} from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { isValidOrganizerName, ORGANIZER_NAME_MAX } from '../league.util';

export const TOURNAMENT_NAME_MAX = 80;

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
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
    SelectComponent,
    SelectOptionComponent,
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
  protected readonly knownOwnerName = signal('');
  protected readonly editingOwnerName = signal(false);
  protected readonly copySettings = signal(false);

  protected readonly nameMax = TOURNAMENT_NAME_MAX;
  protected readonly ownerNameMax = ORGANIZER_NAME_MAX;

  protected readonly tierListFrom = signal('');

  protected readonly copySource = computed(
    () => this.league()?.newTournamentDefaults?.copyFrom ?? null,
  );

  protected readonly tierListSources = computed(
    () => this.league()?.newTournamentDefaults?.tierLists ?? [],
  );

  protected readonly tierListSource = computed(
    () =>
      this.tierListSources().find(
        (source) => source.tournamentSlug === this.tierListFrom(),
      ) ?? null,
  );

  protected readonly tierListHint = computed(() => {
    const source = this.tierListSource();
    return source
      ? `A branch of ${source.name}'s list. Edits to it won't change ${source.name}.`
      : "Build or attach one later from the tournament's settings.";
  });

  protected sourceDetail(source: League.TierListSource): string {
    return [source.format, source.ruleset].filter(Boolean).join(' · ');
  }

  protected readonly requirementsDropped = computed(
    () =>
      this.copySettings() &&
      this.tierListFrom() !== '' &&
      this.tierListFrom() !== this.copySource()?.tournamentSlug,
  );

  protected readonly ownerNameValid = computed(() =>
    isValidOrganizerName(this.ownerName()),
  );

  protected readonly showOwnerNameField = computed(
    () =>
      this.editingOwnerName() ||
      !isValidOrganizerName(this.knownOwnerName()),
  );

  protected readonly canSubmit = computed(
    () =>
      !this.saving() &&
      this.name().trim().length > 0 &&
      this.ownerNameValid(),
  );

  ngOnInit(): void {
    this.leagueService
      .getLeague(this.leagueSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (league) => {
          const defaults = league.newTournamentDefaults;
          this.ownerName.set(defaults?.ownerName ?? '');
          this.knownOwnerName.set(defaults?.ownerName ?? '');
          this.copySettings.set(!!defaults?.copyFrom);
          this.tierListFrom.set(
            league.newTournamentDefaults?.tierLists[0]?.tournamentSlug ?? '',
          );
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
        tierListFrom: this.tierListFrom() || null,
        ...(copyFrom ? { copyFrom } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ tournamentSlug }) => {
          this.toast.success('Tournament created.');
          this.router.navigate([
            '/',
            LEAGUE_ZONE_PATH,
            this.leagueSlug,
            'tournaments',
            tournamentSlug,
            LEAGUE_ZONE_MANAGE_PATH,
          ]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(
            apiErrorMessage(err, 'Could not create the tournament.'),
          );
        },
      });
  }
}

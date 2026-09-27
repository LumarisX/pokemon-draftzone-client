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
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  LEAGUE_DESCRIPTION_MAX,
  LEAGUE_NAME_MAX,
} from '../league-create/league-create.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { LogoFieldComponent } from '../logo-field/logo-field.component';

@Component({
  selector: 'pdz-league-edit',
  templateUrl: './league-edit.component.html',
  styleUrl: './league-edit.component.scss',
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
    LogoFieldComponent,
    PageComponent,
    PageHeaderComponent,
  ],
})
export class LeagueEditComponent implements OnInit {
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
  protected readonly description = signal('');
  protected readonly logo = signal<string | null>(null);

  protected readonly nameMax = LEAGUE_NAME_MAX;
  protected readonly descriptionMax = LEAGUE_DESCRIPTION_MAX;

  private readonly changes = computed<League.UpdateLeaguePayload>(() => {
    const league = this.league();
    if (!league) return {};
    const name = this.name().trim();
    const description = this.description().trim();
    const logo = this.logo();
    return {
      ...(name !== league.name ? { name } : {}),
      ...(description !== (league.description ?? '') ? { description } : {}),
      ...(logo !== (league.logo ?? null) ? { logo } : {}),
    };
  });

  protected readonly canSubmit = computed(
    () =>
      !this.saving() &&
      this.name().trim().length > 0 &&
      Object.keys(this.changes()).length > 0,
  );

  ngOnInit(): void {
    this.leagueService
      .getLeague(this.leagueSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (league) => {
          this.name.set(league.name);
          this.description.set(league.description ?? '');
          this.logo.set(league.logo ?? null);
          this.league.set(league);
        },
        error: () => this.loadFailed.set(true),
      });
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    this.leagueService
      .updateLeague(this.leagueSlug, this.changes())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('League saved.');
          this.router.navigate(this.leagueLink);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(apiErrorMessage(err, 'Could not save the league.'));
        },
      });
  }
}

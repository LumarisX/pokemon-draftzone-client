import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LEAGUE_ADS_PATH, LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';

export const LEAGUE_NAME_MAX = 80;
export const LEAGUE_DESCRIPTION_MAX = 2000;

@Component({
  selector: 'pdz-league-create',
  templateUrl: './league-create.component.html',
  styleUrl: './league-create.component.scss',
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
  ],
})
export class LeagueCreateComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly capabilities = signal<League.LeagueCapabilities | null>(
    null,
  );
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);
  protected readonly name = signal('');
  protected readonly description = signal('');

  protected readonly nameMax = LEAGUE_NAME_MAX;
  protected readonly descriptionMax = LEAGUE_DESCRIPTION_MAX;
  protected readonly leagueListLink = ['/', LEAGUE_ADS_PATH];

  ngOnInit(): void {
    this.leagueService
      .getLeagueCapabilities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (capabilities) => this.capabilities.set(capabilities),
        error: () => this.loadFailed.set(true),
      });
  }

  protected canSubmit(): boolean {
    return !this.saving() && this.name().trim().length > 0;
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    const description = this.description().trim();
    this.leagueService
      .createLeague({
        name: this.name().trim(),
        ...(description ? { description } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ leagueSlug }) => {
          this.toast.success('League created. Now set up its first tournament.');
          this.router.navigate([
            '/',
            LEAGUE_ZONE_PATH,
            leagueSlug,
            'tournaments',
            'new',
          ]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(
            err?.error?.error?.message ?? 'Could not create the league.',
          );
        },
      });
  }
}

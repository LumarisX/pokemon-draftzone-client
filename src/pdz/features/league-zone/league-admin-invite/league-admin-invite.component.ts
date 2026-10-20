import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import {
  ORGANIZER_NAME_MAX,
  isValidOrganizerName,
} from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

@Component({
  selector: 'pdz-league-admin-invite',
  templateUrl: './league-admin-invite.component.html',
  styleUrl: './league-admin-invite.component.scss',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueAdminInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leagueService = inject(LeagueZoneService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly leagueSlug =
    this.route.snapshot.paramMap.get('leagueSlug') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token');

  protected readonly loading = signal(true);
  protected readonly preview = signal<League.LeagueAdminInvitePreview | null>(
    null,
  );
  protected readonly accepting = signal(false);
  protected readonly name = signal('');
  protected readonly nameMax = ORGANIZER_NAME_MAX;
  protected readonly isValidName = isValidOrganizerName;

  protected readonly leagueLink = ['/', LEAGUE_ZONE_PATH, this.leagueSlug];

  ngOnInit(): void {
    if (!this.token) {
      this.loading.set(false);
      return;
    }

    this.leagueService
      .previewLeagueAdminInvite(this.leagueSlug, this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          this.name.set(preview.suggestedName);
          this.preview.set(preview);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected accept(): void {
    const name = this.name();
    if (!this.token || !isValidOrganizerName(name)) return;
    this.accepting.set(true);
    this.leagueService
      .acceptLeagueAdminInvite(this.leagueSlug, this.token, name.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success("You're now a league admin.");
          this.router.navigate(this.leagueLink);
        },
        error: (err) => {
          this.accepting.set(false);
          this.toast.error(
            apiErrorMessage(err, 'Could not accept this invite.'),
          );
        },
      });
  }
}

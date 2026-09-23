import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LEAGUE_ZONE_MANAGE_PATH,
  LEAGUE_ZONE_PATH,
} from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { isValidOrganizerName, ORGANIZER_NAME_MAX } from '../league.util';

@Component({
  selector: 'pdz-organizer-invite',
  templateUrl: './organizer-invite.component.html',
  styleUrl: './organizer-invite.component.scss',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
  ],
})
export class OrganizerInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leagueService = inject(LeagueZoneService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly leagueSlug =
    this.route.snapshot.paramMap.get('leagueSlug') ?? '';
  private readonly tournamentSlug =
    this.route.snapshot.paramMap.get('tournamentSlug') ?? '';
  private readonly token = this.route.snapshot.queryParamMap.get('token');

  protected readonly loading = signal(true);
  protected readonly preview = signal<League.OrganizerInvitePreview | null>(
    null,
  );
  protected readonly accepting = signal(false);
  protected name = '';
  protected readonly nameMax = ORGANIZER_NAME_MAX;
  protected readonly isValidName = isValidOrganizerName;

  protected readonly tournamentLink = [
    '/',
    LEAGUE_ZONE_PATH,
    this.leagueSlug,
    'tournaments',
    this.tournamentSlug,
  ];
  protected readonly manageLink = [
    ...this.tournamentLink,
    LEAGUE_ZONE_MANAGE_PATH,
  ];

  ngOnInit(): void {
    if (!this.token) {
      this.loading.set(false);
      return;
    }

    this.leagueService
      .previewOrganizerInvite(this.leagueSlug, this.tournamentSlug, this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          this.name = preview.suggestedName;
          this.preview.set(preview);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected accept(): void {
    if (!this.token || !isValidOrganizerName(this.name)) return;
    this.accepting.set(true);
    this.leagueService
      .acceptOrganizerInvite(
        this.leagueSlug,
        this.tournamentSlug,
        this.token,
        this.name.trim(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success("You're now an organizer.");
          this.router.navigate(this.manageLink);
        },
        error: (err) => {
          this.accepting.set(false);
          this.toast.error(
            err?.error?.error?.message ?? 'Could not accept this invite.',
          );
        },
      });
  }
}

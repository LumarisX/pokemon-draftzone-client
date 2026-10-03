import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { AuthService } from '@pdz/core/services/auth0.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { catchError, of, switchMap, take } from 'rxjs';

@Component({
  selector: 'pdz-tournament-draft',
  template: `<div class="redirect-state"><pdz-loading /></div>`,
  styleUrl: './tournament-draft.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingComponent],
})
export class TournamentDraftComponent {
  private leagueService = inject(LeagueZoneService);
  private router = inject(Router);

  constructor() {
    inject(AuthService)
      .isAuthenticated$.pipe(
        take(1),
        switchMap((isAuthenticated) =>
          isAuthenticated
            ? this.leagueService
                .getCoachData({ suppressStatuses: [404] })
                .pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((coachData) => this.redirect(coachData));
  }

  private redirect(coachData: League.CoachProfile | null): void {
    const poolsList = [
      '/',
      LEAGUE_ZONE_PATH,
      this.leagueService.leagueSlug(),
      'tournaments',
      this.leagueService.tournamentSlug(),
      'pools',
    ];
    const destination = coachData?.pool
      ? [...poolsList, coachData.pool.poolSlug]
      : poolsList;
    this.router.navigate(destination, { replaceUrl: true });
  }
}

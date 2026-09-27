import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { AuthService } from '@pdz/core/services/auth0.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-tournament-draft',
  templateUrl: './tournament-draft.component.html',
  styleUrl: './tournament-draft.component.scss',
  imports: [LoadingComponent],
})
export class TournamentDraftComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.authService.isAuthenticated$
      .pipe(
        take(1),
        switchMap((isAuthenticated) =>
          isAuthenticated
            ? this.leagueService
                .getCoachData({ suppressStatuses: [404] })
                .pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((coachData: League.CoachProfile | null) => {
        this.redirect(coachData);
      });
  }

  private redirect(coachData: League.CoachProfile | null): void {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    const poolsList = [
      '/leagues',
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'pools',
    ];
    const destination = coachData?.pool
      ? [...poolsList, coachData.pool.poolSlug]
      : poolsList;
    this.router.navigate(destination, { replaceUrl: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

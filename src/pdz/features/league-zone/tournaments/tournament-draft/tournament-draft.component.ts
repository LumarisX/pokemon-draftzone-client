import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { AuthService } from '@pdz/core/services/auth0.service';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';

/**
 * Smart entry point for "/draft" — sends the current user straight to the
 * draft their team belongs to, or to the drafts list if they have no team
 * in this tournament (or aren't signed in at all).
 */
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
    const leagueKey = this.leagueService.leagueKey();
    const tournamentKey = this.leagueService.tournamentKey();
    const draftsList = [
      '/leagues',
      leagueKey,
      'tournaments',
      tournamentKey,
      'drafts',
    ];
    const destination = coachData?.draft
      ? [...draftsList, coachData.draft.draftKey]
      : draftsList;
    this.router.navigate(destination, { replaceUrl: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { getLeagueLogoUrl } from '../league.util';

@Component({
  selector: 'pdz-league-landing',
  templateUrl: './league-landing.component.html',
  styleUrl: './league-landing.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    ButtonComponent,
    EmptyStateComponent,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
  ],
})
export class LeagueLandingComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private destroy$ = new Subject<void>();

  league: League.LeagueSummary | null = null;

  getLogoUrl = getLeagueLogoUrl;

  ngOnInit(): void {
    this.leagueService
      .getLeague()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (league) => {
          this.league = league;
        },
        error: (err) => {
          console.error('Error loading league:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isSeasonOver(tournament: League.TournamentSummary): boolean {
    if (!tournament.seasonEnd) return false;
    return new Date() > new Date(tournament.seasonEnd);
  }

  isSignUpOpen(tournament: League.TournamentSummary): boolean {
    if (!tournament.signUpDeadline) return false;
    const now = new Date();
    return (
      now <= new Date(tournament.signUpDeadline) &&
      !this.isSeasonOver(tournament)
    );
  }

  getTournamentStatus(
    tournament: League.TournamentSummary,
  ): 'upcoming' | 'active' | 'completed' {
    const now = new Date();
    if (tournament.seasonEnd && now > new Date(tournament.seasonEnd))
      return 'completed';
    if (tournament.seasonStart && now >= new Date(tournament.seasonStart))
      return 'active';
    return 'upcoming';
  }
}

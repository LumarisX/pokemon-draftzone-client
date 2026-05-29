import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoadingComponent } from '../../images/loading/loading.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';
import { getLogoUrlOld } from '../league.util';

@Component({
  selector: 'pdz-league-landing',
  templateUrl: './league-landing.component.html',
  styleUrl: './league-landing.component.scss',
  imports: [CommonModule, RouterModule, LoadingComponent],
})
export class LeagueLandingComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private destroy$ = new Subject<void>();

  league: League.LeagueSummary | null = null;

  getLogoUrl = getLogoUrlOld('league-uploads');

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
    return now <= new Date(tournament.signUpDeadline) && !this.isSeasonOver(tournament);
  }

  getTournamentStatus(
    tournament: League.TournamentSummary,
  ): 'upcoming' | 'active' | 'completed' {
    const now = new Date();
    if (tournament.seasonEnd && now > new Date(tournament.seasonEnd)) return 'completed';
    if (tournament.seasonStart && now >= new Date(tournament.seasonStart)) return 'active';
    return 'upcoming';
  }
}
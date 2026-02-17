import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';
import { getLogoUrlOld } from '../../league.util';
import { LoadingComponent } from '../../../images/loading/loading.component';

@Component({
  selector: 'pdz-tournament-landing',
  templateUrl: './tournament-landing.component.html',
  styleUrl: './tournament-landing.component.scss',
  imports: [CommonModule, RouterModule, LoadingComponent],
})
export class TournamentLandingComponent implements OnInit {
  leagueService = inject(LeagueZoneService);
  leagueInfo: League.LeagueInfo | null = null;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leagueInfo) => {
          this.leagueInfo = leagueInfo;
        },
        error: (error) => {
          console.error('Error fetching league info:', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getLogoUrl = getLogoUrlOld('league-uploads');

  isSignUpClosed(): boolean {
    if (!this.leagueInfo?.signUpDeadline) return false;
    return new Date() > new Date(this.leagueInfo.signUpDeadline);
  }
}

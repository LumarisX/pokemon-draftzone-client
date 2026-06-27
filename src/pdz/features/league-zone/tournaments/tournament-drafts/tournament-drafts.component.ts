import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-tournament-drafts',
  templateUrl: './tournament-drafts.component.html',
  styleUrl: './tournament-drafts.component.scss',
  imports: [CommonModule, RouterModule, LoadingComponent],
})
export class TournamentDraftsComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private destroy$ = new Subject<void>();

  leagueInfo: League.LeagueInfo | null = null;

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
}

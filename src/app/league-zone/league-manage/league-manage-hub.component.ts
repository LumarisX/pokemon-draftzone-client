import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IconComponent } from '../../images/icon/icon.component';
import { LoadingComponent } from '../../images/loading/loading.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';
import { getLogoUrlOld } from '../league.util';

@Component({
  selector: 'pdz-league-manage-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, LoadingComponent],
  templateUrl: './league-manage-hub.component.html',
  styleUrls: ['./league-manage-hub.component.scss'],
})
export class LeagueManageHubComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);

  leagueInfo: League.LeagueInfo | null = null;
  isLoading = true;
  private destroy$ = new Subject<void>();

  getLogoUrl = getLogoUrlOld('league-uploads');

  get leagueKey() {
    return this.leagueService.leagueKey();
  }

  get tournamentKey() {
    return this.leagueService.tournamentKey();
  }

  get managePath() {
    return `/leagues/${this.leagueKey}/tournaments/${this.tournamentKey}/manage`;
  }

  get tournamentBasePath() {
    return `/leagues/${this.leagueKey}/tournaments/${this.tournamentKey}`;
  }

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.leagueInfo = info;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading tournament info:', err);
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isSignUpOpen(): boolean {
    if (!this.leagueInfo?.signUpDeadline) return false;
    return new Date() <= new Date(this.leagueInfo.signUpDeadline);
  }

  isDraftActive(): boolean {
    if (!this.leagueInfo?.draftStart || !this.leagueInfo?.draftEnd)
      return false;
    const now = new Date();
    return (
      now >= new Date(this.leagueInfo.draftStart) &&
      now <= new Date(this.leagueInfo.draftEnd)
    );
  }

  isSeasonActive(): boolean {
    if (!this.leagueInfo?.seasonStart || !this.leagueInfo?.seasonEnd)
      return false;
    const now = new Date();
    return (
      now >= new Date(this.leagueInfo.seasonStart) &&
      now <= new Date(this.leagueInfo.seasonEnd)
    );
  }
}

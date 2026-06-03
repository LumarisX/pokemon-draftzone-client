import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoadingComponent } from '../../images/loading/loading.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';
import { getLogoUrl } from '../league.util';
import { IconComponent } from '../../images/icon/icon.component';

@Component({
  selector: 'pdz-league-coach',
  imports: [CommonModule, RouterModule, LoadingComponent, IconComponent],
  templateUrl: './league-coach.component.html',
  styleUrl: './league-coach.component.scss',
})
export class LeagueCoachComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  profile: League.CoachProfile | null = null;
  leagueInfo: League.LeagueInfo | null = null;
  isLoading = true;
  error = false;
  getLogoUrl = getLogoUrl;

  get divisionBase(): string[] {
    const { leagueKey, tournamentKey } = this;
    const divKey = this.profile?.division?.divisionKey;
    if (!leagueKey || !tournamentKey || !divKey) return [];
    return [
      '/leagues',
      leagueKey,
      'tournaments',
      tournamentKey,
      'divisions',
      divKey,
    ];
  }

  get teamLink(): string[] {
    return [...this.divisionBase, 'teams', this.profile?.teamId ?? ''];
  }

  private get leagueKey() {
    return this.leagueService.leagueKey();
  }
  private get tournamentKey() {
    return this.leagueService.tournamentKey();
  }

  tournamentBase(): string[] {
    const { leagueKey, tournamentKey } = this;
    if (!leagueKey || !tournamentKey) return [];
    return ['/leagues', leagueKey, 'tournaments', tournamentKey];
  }

  ngOnInit(): void {
    this.leagueService
      .getCoachData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isLoading = false;
        },
        error: () => {
          this.error = true;
          this.isLoading = false;
        },
      });

    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => (this.leagueInfo = info),
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

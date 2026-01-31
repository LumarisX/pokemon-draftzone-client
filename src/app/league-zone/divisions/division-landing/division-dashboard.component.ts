import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-league',
  imports: [RouterModule],
  templateUrl: './division-dashboard.component.html',
  styleUrls: ['./division-dashboard.component.scss'],
})
export class LeagueDashboardComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  team?: League.LeagueTeam;
  matchups: League.Matchup[] = [];
  leagueId?: string;
  leagueName = '';
  divisionName = '';

  navigationSections: { label: string; route: string[]; disabled?: boolean }[] =
    [
      {
        label: 'Scheduling',
        route: ['/leagues', this.leagueKey, this.divisionKey, 'schedule'],
      },
      {
        label: 'Teams',
        route: ['/leagues', this.leagueKey, this.divisionKey, 'teams'],
      },
      {
        label: 'Standings',
        route: ['/leagues', this.leagueKey, this.divisionKey, 'standings'],
      },
      {
        label: 'Tier List',
        route: ['/leagues', this.leagueKey, 'tier-list'],
      },
      {
        label: 'Draft',
        route: ['/leagues', this.leagueKey, this.divisionKey, 'draft'],
      },
    ];

  ngOnInit(): void {
    this.leagueZoneService
      .getDivisionDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((details) => {
        this.leagueName = details.leagueName;
        this.divisionName = details.divisionName;
      });
  }

  get leagueKey(): string {
    return this.leagueZoneService.leagueKey() || '';
  }

  get divisionKey(): string {
    return this.leagueZoneService.divisionKey() || '';
  }

  navigateTo(route: string[]): void {
    this.router.navigate(route);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

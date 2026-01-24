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
  leagueKey = '';
  divisionKey = '';

  navigationSections: { label: string; route: string; disabled?: boolean }[] = [
    { label: 'Scheduling', route: 'schedule' },
    { label: 'Teams', route: 'teams' },
    { label: 'Standings', route: 'standings' },
    { label: 'Tier List', route: 'tier-list' },
    { label: 'Draft', route: 'draft' },
  ];

  ngOnInit(): void {
    this.leagueZoneService
      .getDivisionDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((details) => {
        this.leagueName = details.leagueName;
        this.divisionName = details.divisionName;
        this.leagueKey = this.leagueZoneService.leagueKey() || '';
        this.divisionKey = this.leagueZoneService.divisionKey() || '';
      });
  }

  navigateTo(route: string): void {
    this.router.navigate(['/leagues', this.leagueKey, this.divisionKey, route]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

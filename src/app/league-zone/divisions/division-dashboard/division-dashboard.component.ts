import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-division-dashboard',
  imports: [RouterModule],
  templateUrl: './division-dashboard.component.html',
  styleUrls: ['./division-dashboard.component.scss'],
})
export class DivisionDashboardComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  team?: League.LeagueTeam;
  matchups: League.Matchup[] = [];
  tournamentId?: string;
  leagueName = '';
  divisionName = '';

  ngOnInit(): void {
    this.leagueZoneService
      .getDivisionDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((details) => {
        this.leagueName = details.leagueName;
        this.divisionName = details.divisionName;
      });
  }

  get tournamentKey(): string {
    return this.leagueZoneService.tournamentKey() || '';
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

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';
import { getLogoUrlOld } from '../../league.util';
import { IconComponent } from '../../../images/icon/icon.component';
import { MatchupCardComponent } from '../../league-schedule/matchup-card/matchup-card.component';

@Component({
  selector: 'pdz-division-dashboard',
  imports: [RouterModule, IconComponent, MatchupCardComponent],
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
  logo?: string;
  stage?: League.Stage = undefined;

  ngOnInit(): void {
    this.leagueZoneService
      .getDivisionDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((details) => {
        this.leagueName = details.leagueName;
        this.divisionName = details.divisionName;
        this.logo = details.logo;
      });

    this.leagueZoneService
      .getSchedule({ stage: 'current' })
      .pipe(takeUntil(this.destroy$))
      .subscribe((matchups) => {
        this.stage = matchups[0];
      });
  }

  getLogoUrl = getLogoUrlOld('league-uploads');

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

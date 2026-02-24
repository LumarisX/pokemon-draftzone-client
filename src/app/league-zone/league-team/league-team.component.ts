import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IconComponent } from '../../images/icon/icon.component';
import { LoadingComponent } from '../../images/loading/loading.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';
import { getLogoUrl } from '../league.util';
import { MatchupCardComponent } from '../league-schedule/matchup-card/matchup-card.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'pdz-league-team',
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent,
    MatIconModule,
    IconComponent,
    MatchupCardComponent,
    SpriteComponent,
  ],
  templateUrl: './league-team.component.html',
  styleUrls: ['./league-team.component.scss'],
})
export class LeagueTeamComponent implements OnInit, OnDestroy {
  private readonly leagueService = inject(LeagueZoneService);

  teamData?: League.LeagueTeam;
  scheduleStages!: League.Stage[];
  getLogoUrl = getLogoUrl;

  total = {
    cost: 0,
    kill: 0,
    deaths: 0,
  };

  private readonly destroy$ = new Subject<void>();

  getCurrentTimeInTimezone(timezone?: string): string {
    if (!timezone) return '';
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return formatter.format(now);
    } catch (error) {
      return timezone;
    }
  }

  ngOnInit(): void {
    this.loadTeam();
    this.loadSchedule();
  }

  private loadTeam(): void {
    this.leagueService
      .getTeam()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.teamData = data;
          this.total = data.draft.reduce(
            (sum, p) => ({
              cost: sum.cost + p.cost,
              kill: sum.kill,
              deaths: sum.deaths,
            }),
            {
              cost: 0,
              kill: 0,
              deaths: 0,
            },
          );
        },
        error: (error) => {
          console.error('Error loading team data:', error);
        },
      });
  }

  private loadSchedule(): void {
    this.leagueService
      .getSchedule()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.scheduleStages = data;
        },
        error: (error) => {
          console.error('Error loading schedule:', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadingComponent } from '../../images/loading/loading.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { PlusSignPipe } from '../../util/pipes/plus-sign.pipe';
import { League } from '../league.interface';
import { getLogoUrl } from '../league.util';

@Component({
  selector: 'pdz-league-team',
  imports: [
    CommonModule,
    LoadingComponent,
    SpriteComponent,
    PlusSignPipe,
    MatIconModule,
  ],
  templateUrl: './league-team.component.html',
  styleUrls: ['./league-team.component.scss'],
})
export class LeagueTeamComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);
  private activatedRoute = inject(ActivatedRoute);

  teamData?: League.LeagueTeam;

  getLogoUrl = getLogoUrl;

  private destroy$ = new Subject<void>();

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
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const teamId = params.get('teamId');
        if (teamId) {
          this.fetchTeamData(teamId);
        }
      });
  }

  fetchTeamData(teamId: string): void {
    this.leagueService
      .getTeam(teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.teamData = data;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

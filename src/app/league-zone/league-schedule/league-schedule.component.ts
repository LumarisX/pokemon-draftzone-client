import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { League } from '../league.interface';
import { MatchupCardComponent } from './matchup-card/matchup-card.component';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../images/icon/icon.component';
import { LoadingComponent } from '../../images/loading/loading.component';

@Component({
  selector: 'pdz-league-schedule',
  imports: [
    MatchupCardComponent,
    RouterModule,
    IconComponent,
    LoadingComponent,
  ],
  templateUrl: './league-schedule.component.html',
  styleUrls: ['./league-schedule.component.scss'],
})
export class LeagueScheduleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private leagueService = inject(LeagueZoneService);

  stages!: League.Stage[];

  ngOnInit(): void {
    this.loadSchedule();
  }

  private loadSchedule(): void {
    this.leagueService
      .getSchedule()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stages = data;
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

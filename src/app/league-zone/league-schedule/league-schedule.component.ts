import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { League } from '../league.interface';
import { MatchupCardComponent } from './matchup-card/matchup-card.component';
import { ApiService } from '../../services/api.service';
import { Subject } from 'rxjs';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';

@Component({
  selector: 'pdz-league-schedule',
  imports: [MatchupCardComponent],
  templateUrl: './league-schedule.component.html',
  styleUrls: ['./league-schedule.component.scss'],
})
export class LeagueScheduleComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private leagueService = inject(LeagueZoneService);

  stages: League.Stage[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadSchedule();
  }

  private loadSchedule(): void {
    this.isLoading = true;
    this.error = null;

    this.leagueService
      .getSchedule()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stages = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading schedule:', error);
          this.error = 'Failed to load schedule';
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

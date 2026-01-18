import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { League } from '../league.interface';
import { MatchupCardComponent } from './matchup-card/matchup-card.component';
import { ApiService } from '../../services/api.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'pdz-league-schedule',
  imports: [MatchupCardComponent],
  templateUrl: './league-schedule.component.html',
  styleUrls: ['./league-schedule.component.scss'],
})
export class LeagueScheduleComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  stages: League.Stage[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const leagueKey = params['leagueKey'];
        const divisionKey = params['divisionKey'];

        if (leagueKey && divisionKey) {
          // Division-level schedule
          this.loadSchedule(leagueKey, divisionKey);
        } else if (leagueKey) {
          // League-level schedule (all divisions)
          this.loadLeagueSchedule(leagueKey);
        }
      });
  }

  private loadSchedule(leagueKey: string, divisionKey: string): void {
    this.isLoading = true;
    this.error = null;

    this.apiService
      .get<League.Stage[]>(
        ['leagues', leagueKey, 'divisions', divisionKey, 'schedule'],
        false,
      )
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

  private loadLeagueSchedule(leagueKey: string): void {
    this.isLoading = true;
    this.error = null;

    this.apiService
      .get<League.Stage[]>(['leagues', leagueKey, 'schedule'], false)
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

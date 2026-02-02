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
        const tournamentKey = params['tournamentKey'];
        const divisionKey = params['divisionKey'];

        if (tournamentKey && divisionKey) {
          // Division-level schedule
          this.loadSchedule(tournamentKey, divisionKey);
        } else if (tournamentKey) {
          // League-level schedule (all divisions)
          this.loadLeagueSchedule(tournamentKey);
        }
      });
  }

  private loadSchedule(tournamentKey: string, divisionKey: string): void {
    this.isLoading = true;
    this.error = null;

    this.apiService
      .get<League.Stage[]>(
        ['leagues', tournamentKey, 'divisions', divisionKey, 'schedule'],
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

  private loadLeagueSchedule(tournamentKey: string): void {
    this.isLoading = true;
    this.error = null;

    this.apiService
      .get<League.Stage[]>(['leagues', tournamentKey, 'schedule'], false)
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

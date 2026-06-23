import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { MatchupCardComponent } from './matchup-card/matchup-card.component';

@Component({
  selector: 'pdz-league-schedule-widget',
  imports: [MatchupCardComponent],
  templateUrl: './league-schedule-widget.component.html',
  styleUrl: './league-schedule-widget.component.scss',
})
export class LeagueScheduleWidgetComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  scheduleRounds?: League.Stage[];

  @Input() stageId!: string;
  @Input() roundFilter?: 'current' | 'past';

  ngOnInit(): void {
    this.leagueService
      .getSchedule({
        round: this.roundFilter,
        stageId: this.stageId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.scheduleRounds = data.rounds;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

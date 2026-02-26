import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';
import { MatchupCardComponent } from '../../league-schedule/matchup-card/matchup-card.component';

@Component({
  selector: 'pdz-league-schedule-widget',
  imports: [MatchupCardComponent],
  templateUrl: './league-schedule-widget.component.html',
  styleUrl: './league-schedule-widget.component.scss',
})
export class LeagueScheduleWidgetComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  scheduleStages?: League.Stage[];

  @Input() stage?: 'current' | 'past';

  ngOnInit(): void {
    this.leagueService
      .getSchedule({
        stage: this.stage,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stages) => {
          this.scheduleStages = stages;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

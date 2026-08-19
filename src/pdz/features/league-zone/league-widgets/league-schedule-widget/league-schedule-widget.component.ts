import { Component, inject, OnDestroy, OnInit, input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { MatchupCardComponent } from '../../matchup-card/matchup-card.component';
import { MatchupCard } from '../../matchup-card/matchup-card.model';
import { scheduleMatchupToCard } from '../../matchup-card/schedule-matchup.adapter';

interface ScheduleStageView {
  id: string;
  name: string;
  cards: MatchupCard[];
}

interface ScheduleRoundView {
  id: string;
  name: string;
  stages: ScheduleStageView[];
}

@Component({
  selector: 'pdz-league-schedule-widget',
  imports: [MatchupCardComponent],
  templateUrl: './league-schedule-widget.component.html',
  styleUrl: './league-schedule-widget.component.scss',
})
export class LeagueScheduleWidgetComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  scheduleRounds?: ScheduleRoundView[];

  readonly roundFilter = input<'current' | 'past'>();

  ngOnInit(): void {
    this.leagueService
      .getSchedule({ round: this.roundFilter() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const base = [
            '/leagues',
            this.leagueService.leagueSlug() ?? '',
            'tournaments',
            this.leagueService.tournamentSlug() ?? '',
          ];
          this.scheduleRounds = data.rounds.map((round) => ({
            id: round._id,
            name: round.name,
            stages: round.stages.map((stage) => ({
              id: stage._id,
              name: stage.name,
              cards: stage.matchups.map((matchup) =>
                scheduleMatchupToCard(matchup, base),
              ),
            })),
          }));
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

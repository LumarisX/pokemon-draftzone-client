import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { interval, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { LeagueZoneService } from '../league-zone.service';
import { LeagueScheduleWidgetComponent } from '../league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueTradeWidgetComponent } from '../league-widgets/league-trade-widget/league-trade-widget.component';
import { League, TradeLog } from '../league.interface';
import { getLogoUrl } from '../league.util';

@Component({
  selector: 'pdz-league-team',
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent,
    MatIconModule,
    IconComponent,
    SpriteComponent,
    LeagueTradeWidgetComponent,
    LeagueScheduleWidgetComponent,
  ],
  templateUrl: './league-team.component.html',
  styleUrls: ['./league-team.component.scss'],
})
export class LeagueTeamComponent implements OnInit, OnDestroy {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly route = inject(ActivatedRoute);

  teamData?: League.LeagueTeam;
  scheduleRounds!: League.Stage[];
  tradeRounds?: { name: string; trades: TradeLog[] }[];
  getLogoUrl = getLogoUrl;
  coachCurrentTime = '';

  stageId: string | null = null;

  total = {
    cost: 0,
    kill: 0,
    deaths: 0,
  };

  private readonly destroy$ = new Subject<void>();
  get backLink(): string[] {
    const leagueKey = this.leagueService.leagueKey();
    const tournamentKey = this.leagueService.tournamentKey();
    const draftKey = this.leagueService.draftKey();
    if (!leagueKey || !tournamentKey) return ['/'];
    if (draftKey) {
      return [
        '/leagues',
        leagueKey,
        'tournaments',
        tournamentKey,
        'drafts',
        draftKey,
        'teams',
      ];
    }
    return ['/leagues', leagueKey, 'tournaments', tournamentKey];
  }

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
    this.startCoachClock();

    this.leagueService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stages) => {
        this.stageId = stages[0]?._id ?? null;

        this.route.paramMap
          .pipe(
            map((params) => params.get('teamKey')),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
          )
          .subscribe(() => {
            // Force child widgets to re-initialize after team route changes.
            this.teamData = undefined;

            this.loadTeam();
            this.loadSchedule();
            this.loadTrades();
          });
      });
  }

  private startCoachClock(): void {
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateCoachCurrentTime();
      });
  }

  private updateCoachCurrentTime(): void {
    this.coachCurrentTime = this.getCurrentTimeInTimezone(
      this.teamData?.timezone,
    );
  }

  private loadTeam(): void {
    this.leagueService
      .getTeam(this.stageId ?? undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.teamData = data;
          this.updateCoachCurrentTime();
          this.total = data.draft.reduce(
            (sum, p) => ({
              cost: sum.cost + p.cost,
              kill: sum.kill + (p.record?.kills ?? 0),
              deaths: sum.deaths + (p.record?.deaths ?? 0),
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
    if (!this.stageId) return;
    this.leagueService
      .getSchedule({ stageId: this.stageId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.scheduleRounds = data.rounds;
        },
        error: (error) => {
          console.error('Error loading schedule:', error);
        },
      });
  }

  private loadTrades(): void {
    if (!this.stageId) return;
    this.leagueService
      .getTrades({ stageId: this.stageId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.tradeRounds = data.rounds;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

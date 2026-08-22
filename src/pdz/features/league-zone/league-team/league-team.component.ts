import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UploadService } from '@pdz/core/services/upload.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { interval, Observable, of, Subject, switchMap } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  finalize,
  map,
  takeUntil,
} from 'rxjs/operators';
import { LeagueScheduleWidgetComponent } from '../league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueTradeWidgetComponent } from '../league-widgets/league-trade-widget/league-trade-widget.component';
import { LeagueZoneService } from '../league-zone.service';
import { League, TradeLog } from '../league.interface';
import { getLogoUrl } from '../league.util';
import {
  CoachEditDialogComponent,
  CoachEditDialogData,
  CoachEditDialogResult,
} from '../tournaments/tournament-home/coach-edit-dialog/coach-edit-dialog.component';
import {
  TeamEditDialogComponent,
  TeamEditDialogData,
  TeamEditDialogResult,
} from '../tournaments/tournament-home/team-edit-dialog/team-edit-dialog.component';
import {
  TradeProposeDialogComponent,
  TradeProposeDialogData,
  TradeProposeDialogResult,
} from './trade-propose-dialog/trade-propose-dialog.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

@Component({
  selector: 'pdz-league-team',
  imports: [
    CommonModule,
    ButtonComponent,
    RouterModule,
    LoadingComponent,
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
  private readonly dialogs = inject(DialogService);
  private readonly uploadService = inject(UploadService);

  teamData?: League.LeagueTeam;
  scheduleRounds!: League.ScheduleRound[];
  tradeRounds?: { name: string; trades: TradeLog[] }[];
  getLogoUrl = getLogoUrl;
  coachCurrentTime = '';

  /** Set while an edit is being persisted, and cleared once it lands. */
  saving = false;
  saveError = '';

  stageSlug: string | null = null;
  currentRoundIndex = 0;

  @ViewChild(LeagueTradeWidgetComponent)
  private tradeWidget?: LeagueTradeWidgetComponent;

  get currentRoundName(): string | undefined {
    return this.scheduleRounds?.[this.currentRoundIndex]?.name;
  }

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
    this.startCoachClock();

    this.leagueService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stages) => {
        this.stageSlug = stages[0]?.slug ?? null;

        this.route.paramMap
          .pipe(
            map((params) => params.get('teamSlug')),
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
      .getTeam()
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

  async openTeamEdit(): Promise<void> {
    const team = this.teamData;
    if (!team?.isCoach) return;

    const result = await this.dialogs.open<
      TeamEditDialogComponent,
      TeamEditDialogResult,
      TeamEditDialogData
    >(TeamEditDialogComponent, {
      heading: 'Edit Team Info',
      data: {
        teamName: team.name,
        logoUrl: this.getLogoUrl(team.logo),
      },
    }).closed;

    if (result) this.saveTeamEdit(result);
  }

  async openCoachEdit(): Promise<void> {
    const team = this.teamData;
    if (!team?.isCoach) return;

    const result = await this.dialogs.open<
      CoachEditDialogComponent,
      CoachEditDialogResult,
      CoachEditDialogData
    >(CoachEditDialogComponent, {
      heading: 'Edit Coach Info',
      data: {
        name: team.coach,
        gameName: team.gameName ?? '',
        discordName: team.discordName ?? '',
        timezone: team.timezone ?? '',
      },
    }).closed;

    if (result) this.saveCoachEdit(result);
  }

  async openTradePropose(): Promise<void> {
    const team = this.teamData;
    if (!team?.isCoach) return;

    const result = await this.dialogs.open<
      TradeProposeDialogComponent,
      TradeProposeDialogResult,
      TradeProposeDialogData
    >(TradeProposeDialogComponent, {
      heading: 'New Trade',
      size: 'lg',
      data: {
        teamId: team.id,
        teamName: team.name,
        roster: team.draft,
        rosterCost: this.total.cost,
        pointTotal: team.pointTotal,
        roundIndex: this.currentRoundIndex,
        roundName: this.currentRoundName,
      },
    }).closed;

    if (result) this.submitTrade(team.id, result);
  }

  private submitTrade(teamId: string, result: TradeProposeDialogResult): void {
    this.saving = true;
    this.saveError = '';

    this.leagueService
      .sendTrade({
        side1: { team: teamId, pokemon: result.send },
        side2: { pokemon: result.receive },
        roundIndex: result.roundIndex,
      })
      .pipe(
        finalize(() => {
          this.saving = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => this.tradeWidget?.reload(),
        error: (error) => {
          this.saveError = error?.message || 'Could not submit the trade.';
        },
      });
  }

  private saveTeamEdit(result: TeamEditDialogResult): void {
    const team = this.teamData;
    if (!team) return;

    const renamed = result.teamName !== team.name;
    if (!renamed && !result.logoFile) return;

    if (result.logoFile) {
      const invalid = this.validateLogo(result.logoFile);
      if (invalid) {
        this.saveError = invalid;
        return;
      }
    }

    this.saving = true;
    this.saveError = '';

    const rename$: Observable<unknown> = renamed
      ? this.leagueService.updateTeamInfo(team.id, team.slug, {
          teamName: result.teamName,
        })
      : of(null);

    rename$
      .pipe(
        switchMap(() => {
          if (renamed) team.name = result.teamName;
          return result.logoFile
            ? this.uploadLogo(result.logoFile)
            : of<string | null>(null);
        }),
        finalize(() => {
          this.saving = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (logoKey) => {
          if (logoKey) team.logo = logoKey;
        },
        error: (error) => {
          this.saveError = error?.message || 'Could not save team info.';
        },
      });
  }

  private saveCoachEdit(result: CoachEditDialogResult): void {
    const team = this.teamData;
    const coachId = team?.coachId;
    if (!team || !coachId) return;

    this.saving = true;
    this.saveError = '';

    this.leagueService
      .updateCoachProfile(coachId, result)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          team.coach = result.name;
          team.gameName = result.gameName;
          team.discordName = result.discordName;
          team.timezone = result.timezone;
          this.updateCoachCurrentTime();
          this.saving = false;
        },
        error: (error) => {
          this.saveError = error?.message || 'Could not save coach info.';
          this.saving = false;
        },
      });
  }

  private validateLogo(file: File): string | null {
    if (!ALLOWED_LOGO_TYPES.includes(file.type))
      return `Invalid file type. Allowed: ${ALLOWED_LOGO_TYPES.join(', ')}`;
    if (file.size > MAX_LOGO_SIZE)
      return `File size exceeds ${MAX_LOGO_SIZE / 1024 / 1024}MB`;
    return null;
  }

  /**
   * Presign, push to S3, then point the team at the new key. Emits that key
   * once — intermediate upload-progress events are dropped.
   */
  private uploadLogo(file: File): Observable<string | null> {
    const coachId = this.teamData?.coachId;
    if (!coachId) return of(null);

    return this.leagueService
      .getLeagueUploadPresignedUrl(file.name, file.type || 'image/png')
      .pipe(
        switchMap((presigned) => {
          if (!presigned?.url)
            throw new Error('Failed to get pre-signed URL from server');
          return this.uploadService.uploadToS3(presigned.url, file).pipe(
            filter((event) => event.type !== HttpEventType.UploadProgress),
            switchMap((event) => {
              if (!(event instanceof HttpResponse))
                return of<string | null>(null);
              if (!event.ok)
                throw new Error(
                  `S3 upload failed with status: ${event.status}`,
                );
              return this.leagueService
                .updateCoachLogo(coachId, presigned.key)
                .pipe(map(() => presigned.key));
            }),
          );
        }),
      );
  }

  private loadSchedule(): void {
    this.leagueService
      .getSchedule()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.scheduleRounds = data.rounds;
          // The tournament's current round, not a stage's. A coach files a
          // trade against this index, so reading it off a stage would date the
          // trade to the wrong week.
          this.currentRoundIndex = Math.max(data.currentRoundIndex, 0);
        },
        error: (error) => {
          console.error('Error loading schedule:', error);
        },
      });
  }

  private loadTrades(): void {
    if (!this.stageSlug) return;
    this.leagueService
      .getTrades()
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

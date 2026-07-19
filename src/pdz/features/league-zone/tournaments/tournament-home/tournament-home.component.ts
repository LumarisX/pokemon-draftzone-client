import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { catchError, of, Subject, takeUntil } from 'rxjs';
import { LeagueSignUpComponent } from '../../league-sign-up/league-sign-up.component';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { formatCountdown, getLogoUrl } from '../../league.util';
import {
  CoachEditDialogComponent,
  CoachEditDialogData,
} from './coach-edit-dialog/coach-edit-dialog.component';
import {
  TeamEditDialogComponent,
  TeamEditDialogData,
} from './team-edit-dialog/team-edit-dialog.component';

@Component({
  selector: 'pdz-tournament-home',
  templateUrl: './tournament-home.component.html',
  styleUrl: './tournament-home.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    LoadingComponent,
    LeagueSignUpComponent,
    SpriteComponent,
  ],
})
export class TournamentHomeComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  profile: League.CoachProfile | null = null;

  currentTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  isCheckingSignUp = true;

  stages: League.StageSummary[] = [];
  selectedStageId: string | null = null;
  coachStandings: League.CoachStandingData | null = null;
  standingsLoading = false;

  teamData: League.LeagueTeam | null = null;
  rosterTotal = { cost: 0, kills: 0, deaths: 0 };
  rosterLoading = false;

  private draftStart?: Date;
  private draftEnd?: Date;
  draftCountdown: { phase: 'start' | 'end'; display: string } | null = null;
  private countdownTimer?: ReturnType<typeof setInterval>;

  getTeamLogoUrl = getLogoUrl;

  get draftLink(): string[] {
    const leagueKey = this.leagueService.leagueKey();
    const tournamentKey = this.leagueService.tournamentKey();
    const draftKey = this.profile?.draft?.draftKey;
    if (!leagueKey || !tournamentKey || !draftKey) return [];
    return [
      '/leagues',
      leagueKey,
      'tournaments',
      tournamentKey,
      'drafts',
      draftKey,
      'draft',
    ];
  }

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((info) => {
        this.draftStart = info.draftStart
          ? new Date(info.draftStart)
          : undefined;
        this.draftEnd = info.draftEnd ? new Date(info.draftEnd) : undefined;
        this.updateDraftCountdown();
        if ((this.draftStart || this.draftEnd) && !this.countdownTimer) {
          this.countdownTimer = setInterval(
            () => this.updateDraftCountdown(),
            1000,
          );
        }
      });

    this.leagueService
      .getCoachData({ suppressStatuses: [404] })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe((profile) => {
        this.profile = profile;
        this.isCheckingSignUp = false;
        if (profile) {
          this.startClock();
        }

        if (profile?.draft) {
          this.rosterLoading = true;
          this.loadStages();
        } else if (profile?.teamId) {
          this.rosterLoading = true;
          this.loadRoster();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }

  private updateDraftCountdown(): void {
    const now = Date.now();
    if (this.draftStart && this.draftStart.getTime() > now) {
      this.draftCountdown = {
        phase: 'start',
        display: formatCountdown(this.draftStart.getTime() - now),
      };
    } else if (this.draftEnd && this.draftEnd.getTime() > now) {
      this.draftCountdown = {
        phase: 'end',
        display: formatCountdown(this.draftEnd.getTime() - now),
      };
    } else {
      this.draftCountdown = null;
    }
  }

  private startClock(): void {
    this.updateClock();
    this.clockTimer ??= setInterval(() => this.updateClock(), 30_000);
  }

  private updateClock(): void {
    const timezone = this.profile?.timezone;
    if (!timezone) {
      this.currentTime = '';
      return;
    }
    try {
      this.currentTime = new Intl.DateTimeFormat([], {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date());
    } catch {
      // Invalid/unknown timezone — hide the clock rather than crash.
      this.currentTime = '';
    }
  }

  private loadRoster(): void {
    const teamId = this.profile?.teamId;
    if (!teamId) return;
    this.leagueService
      .getTeam(this.selectedStageId ?? undefined, teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.teamData = data;
          this.rosterTotal = data.draft.reduce(
            (sum, p) => ({
              cost: sum.cost + p.cost,
              kills: sum.kills + (p.record?.kills ?? 0),
              deaths: sum.deaths + (p.record?.deaths ?? 0),
            }),
            { cost: 0, kills: 0, deaths: 0 },
          );
          this.rosterLoading = false;
        },
        error: (error) => {
          console.error('Error loading roster:', error);
          this.rosterLoading = false;
        },
      });
  }

  private loadStages(): void {
    this.leagueService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stages) => {
          this.stages = stages;
          if (stages.length) {
            this.selectStage(stages[0]._id);
          } else {
            this.loadRoster();
          }
        },
      });
  }

  onStageSelected(stageId: string): void {
    this.selectStage(stageId);
  }

  openCoachEdit(): void {
    if (!this.profile) return;
    const dialogRef = this.dialog.open(CoachEditDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      data: {
        name: this.profile.name,
        gameName: this.profile.gameName,
        discordName: this.profile.discordName,
        timezone: this.profile.timezone,
      } satisfies CoachEditDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result || !this.profile) return;
        // TODO: persist via the backend once a coach-profile update endpoint
        // exists. For now we only reflect the change in the local UI.
        this.profile = { ...this.profile, ...result };
        this.updateClock();
      });
  }

  openTeamEdit(): void {
    if (!this.profile) return;
    const dialogRef = this.dialog.open(TeamEditDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      data: {
        teamName: this.profile.teamName,
        logoUrl: this.getTeamLogoUrl(this.profile.logo),
      } satisfies TeamEditDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result || !this.profile) return;
        // TODO: persist the team name and upload the new logo once the backend
        // endpoint exists. For now we only reflect the name in the local UI.
        this.profile = { ...this.profile, teamName: result.teamName };
      });
  }

  private selectStage(stageId: string): void {
    if (stageId === this.selectedStageId) return;
    this.selectedStageId = stageId;
    this.loadRoster();
    this.standingsLoading = true;
    this.coachStandings = null;
    this.leagueService
      .getStandings(stageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.coachStandings = data.coachStandings;
          this.standingsLoading = false;
        },
        error: () => {
          this.standingsLoading = false;
        },
      });
  }
}

import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
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
  CoachEditDialogResult,
} from './coach-edit-dialog/coach-edit-dialog.component';
import {
  TeamEditDialogComponent,
  TeamEditDialogData,
  TeamEditDialogResult,
} from './team-edit-dialog/team-edit-dialog.component';

@Component({
  selector: 'pdz-tournament-home',
  templateUrl: './tournament-home.component.html',
  styleUrl: './tournament-home.component.scss',
  imports: [
    RouterModule,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    IconComponent,
    LoadingComponent,
    LeagueSignUpComponent,
    SpriteComponent,
  ],
})
export class TournamentHomeComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly dialogs = inject(DialogService);
  private readonly destroy$ = new Subject<void>();

  profile: League.CoachProfile | null = null;

  currentTime = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  isCheckingSignUp = true;

  teamData: League.LeagueTeam | null = null;
  rosterTotal = { cost: 0, kills: 0, deaths: 0 };
  rosterLoading = false;

  private draftStart?: Date;
  private draftEnd?: Date;
  draftCountdown: { phase: 'start' | 'end'; display: string } | null = null;
  private countdownTimer?: ReturnType<typeof setInterval>;

  getTeamLogoUrl = getLogoUrl;

  get noRosterMessage(): string {
    const countdown = this.draftCountdown;
    if (!countdown) {
      return 'Register your team before the deadline or you will not participate in the tournament.';
    }
    return countdown.phase === 'start'
      ? `The draft will start in ${countdown.display}.`
      : `The draft will end in ${countdown.display}.`;
  }

  get draftLink(): string[] {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    const draftSlug = this.profile?.draft?.draftSlug;
    if (!leagueSlug || !tournamentSlug || !draftSlug) return [];
    return [
      '/leagues',
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'drafts',
      draftSlug,
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

        if (profile?.teamSlug) {
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
    // The team endpoint is keyed by slug, not by the ObjectId the profile also
    // carries — `teamId` is there for payload joins, not for URLs.
    const teamSlug = this.profile?.teamSlug;
    if (!teamSlug) return;
    this.leagueService
      .getTeam(teamSlug)
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

  async openCoachEdit(): Promise<void> {
    if (!this.profile) return;
    const result = await this.dialogs.open<
      CoachEditDialogComponent,
      CoachEditDialogResult,
      CoachEditDialogData
    >(CoachEditDialogComponent, {
      heading: 'Edit Coach Info',
      data: {
        name: this.profile.name,
        gameName: this.profile.gameName,
        discordName: this.profile.discordName,
        timezone: this.profile.timezone,
      },
    }).closed;

    if (!result || !this.profile) return;
    // TODO: persist via the backend once a coach-profile update endpoint
    // exists. For now we only reflect the change in the local UI.
    this.profile = { ...this.profile, ...result };
    this.updateClock();
  }

  async openTeamEdit(): Promise<void> {
    if (!this.profile) return;
    const result = await this.dialogs.open<
      TeamEditDialogComponent,
      TeamEditDialogResult,
      TeamEditDialogData
    >(TeamEditDialogComponent, {
      heading: 'Edit Team Info',
      data: {
        teamName: this.profile.teamName,
        logoUrl: this.getTeamLogoUrl(this.profile.logo),
      },
    }).closed;

    if (!result || !this.profile) return;
    // TODO: persist the team name and upload the new logo once the backend
    // endpoint exists. For now we only reflect the name in the local UI.
    this.profile = { ...this.profile, teamName: result.teamName };
  }
}

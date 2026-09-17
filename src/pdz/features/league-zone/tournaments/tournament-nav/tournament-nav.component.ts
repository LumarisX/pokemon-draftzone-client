import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '@pdz/core/services/auth0.service';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueZoneService } from '../../league-zone.service';
import { LeagueManageService } from '../../league-manage/league-manage.service';
import { League } from '../../league.interface';
import { getLeagueLogoUrl } from '../../league.util';
import { tournamentLinkGroups } from '../tournament-links';

@Component({
  selector: 'pdz-tournament-nav',
  templateUrl: './tournament-nav.component.html',
  styleUrl: './tournament-nav.component.scss',
  imports: [CommonModule, RouterModule, IconComponent, SkeletonComponent],
})
export class TournamentNavComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly authService = inject(AuthService);
  private readonly manageService = inject(LeagueManageService);
  private readonly destroy$ = new Subject<void>();

  leagueInfo: League.LeagueInfo | null = null;
  leagueName: string | null = null;
  profileLoaded = false;

  readonly profile = signal<League.CoachProfile | null>(null);
  readonly canManage = signal(false);
  readonly draftStatus = signal<string | null>(null);

  readonly linkGroups = computed(() =>
    tournamentLinkGroups({
      base: this.tournamentBase(),
      profile: this.profile(),
      draftStatus: this.draftStatus(),
      canManage: this.canManage(),
    }),
  );

  getTournamentLogoUrl = getLeagueLogoUrl;

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => (this.leagueInfo = info),
        error: (error) => console.error('Error fetching league info:', error),
      });

    this.leagueService
      .getLeague()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe((league) => (this.leagueName = league?.name ?? null));

    this.authService.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((isAuthenticated) => {
          if (!isAuthenticated) {
            this.canManage.set(false);
            return of(null);
          }
          this.loadManageRoles();
          return this.leagueService
            .getCoachData({ suppressStatuses: [404] })
            .pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.profileLoaded = true;
        if (profile?.draft) {
          this.loadDraftStatus(profile.draft.draftSlug);
        }
      });
  }

  private loadManageRoles(): void {
    const leagueSlug = this.leagueSlug;
    const tournamentSlug = this.tournamentSlug;
    if (!leagueSlug || !tournamentSlug) return;
    this.manageService
      .canManage(leagueSlug, tournamentSlug)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([] as string[])),
      )
      .subscribe((roles) => this.canManage.set(roles.includes('organizer')));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDraftStatus(draftSlug: string): void {
    this.leagueService
      .getDraftDetails(draftSlug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) =>
          this.draftStatus.set(this.ongoingDraftLabel(details.status)),
        error: () => this.draftStatus.set(null),
      });
  }

  private ongoingDraftLabel(
    status: 'PRE_DRAFT' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED',
  ): string | null {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PAUSED':
        return 'Paused';
      default:
        return null;
    }
  }

  get notJoinedDiscord(): boolean {
    const profile = this.profile();
    return this.profileLoaded && !!profile && !profile.inDiscordServer;
  }

  private get leagueSlug() {
    return this.leagueService.leagueSlug();
  }

  private get tournamentSlug() {
    return this.leagueService.tournamentSlug();
  }

  tournamentBase(): string[] {
    const { leagueSlug, tournamentSlug } = this;
    if (!leagueSlug || !tournamentSlug) return [];
    return ['/leagues', leagueSlug, 'tournaments', tournamentSlug];
  }
}

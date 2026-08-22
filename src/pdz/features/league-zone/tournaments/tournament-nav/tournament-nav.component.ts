import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '@pdz/core/services/auth0.service';
import {
  NavContextService,
  NavMenuLink,
} from '@pdz/core/services/nav-context.service';
import { LeagueZoneService } from '../../league-zone.service';
import { LeagueManageService } from '../../league-manage/league-manage.service';
import { League } from '../../league.interface';
import { getLeagueLogoUrl } from '../../league.util';

@Component({
  selector: 'pdz-tournament-nav',
  templateUrl: './tournament-nav.component.html',
  styleUrl: './tournament-nav.component.scss',
  imports: [CommonModule, RouterModule],
})
export class TournamentNavComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly authService = inject(AuthService);
  private readonly manageService = inject(LeagueManageService);
  private readonly navContext = inject(NavContextService);
  private readonly destroy$ = new Subject<void>();

  leagueInfo: League.LeagueInfo | null = null;
  leagueName: string | null = null;
  profile: League.CoachProfile | null = null;
  profileLoaded = false;
  canManage = false;

  draftStatus: string | null = null;

  getTournamentLogoUrl = getLeagueLogoUrl;

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.leagueInfo = info;
          this.pushNavContext();
        },
        error: (error) => console.error('Error fetching league info:', error),
      });

    this.leagueService
      .getLeague()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (league) => (this.leagueName = league.name),
        error: (error) => console.error('Error fetching league:', error),
      });

    this.authService.isAuthenticated$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((isAuthenticated) => {
          if (!isAuthenticated) {
            this.canManage = false;
            return of(null);
          }
          this.loadManageRoles();
          return this.leagueService
            .getCoachData({ suppressStatuses: [404] })
            .pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((profile) => {
        this.profile = profile;
        this.profileLoaded = true;
        if (profile?.draft) {
          this.loadDraftStatus(profile.draft.draftSlug);
        }
        this.pushNavContext();
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
      .subscribe((roles) => {
        this.canManage = roles.includes('organizer');
        this.pushNavContext();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.navContext.clear();
  }

  private loadDraftStatus(draftSlug: string): void {
    this.leagueService
      .getDraftDetails(draftSlug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.draftStatus = this.ongoingDraftLabel(details.status);
          this.pushNavContext();
        },
        error: () => {
          this.draftStatus = null;
          this.pushNavContext();
        },
      });
  }

  private pushNavContext(): void {
    const items: NavMenuLink[] = [];

    if (this.profile?.draft && this.profile.teamSlug) {
      items.push({ label: 'My Team', route: this.teamLink });
      items.push({
        label: 'Draft',
        route: [...this.draftBase, 'draft'],

        badge: this.draftStatus,
        badgeTone: 'primary',
      });
    }

    items.push(
      { label: 'Standings', route: this.standingsLink },
      { label: 'Teams', route: this.teamsLink },
      { label: 'Schedule', route: this.scheduleLink },
      {
        label: 'Rules',
        route: [...this.tournamentBase(), 'rules'],
      },
      {
        label: 'Tier List',
        route: [...this.tournamentBase(), 'tier-list'],
      },
    );

    if (this.leagueInfo?.discord) {
      items.push({
        label: 'Discord',
        href: `https://discord.gg/${this.leagueInfo.discord}`,

        badge: this.notJoinedDiscord ? 'Not Joined' : null,
        badgeTone: 'danger',
      });
    }

    if (this.canManage) {
      items.push(
        {
          label: 'Settings',
          route: [...this.manageLink, 'settings'],

          groupLabel: 'Manage',
        },
        {
          label: 'Sign-Ups',
          route: [...this.manageLink, 'sign-ups'],
        },
        {
          label: 'Rules',
          route: [...this.manageLink, 'rules'],
        },
        {
          label: 'Tier List',
          route: [...this.tournamentBase(), 'tier-list', 'edit'],
        },
        {
          label: 'Trades',
          route: [...this.manageLink, 'trades'],
        },
        {
          label: 'Dashboard',
          route: this.manageLink,
        },
      );
    }

    this.navContext.set({
      ariaLabel: this.leagueInfo?.name
        ? `${this.leagueInfo.name} navigation`
        : 'Tournament navigation',
      items,
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
    return (
      this.profileLoaded && !!this.profile && !this.profile.inDiscordServer
    );
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

  get manageLink(): string[] {
    const base = this.tournamentBase();
    if (!base.length) return [];
    return [...base, 'manage'];
  }

  get draftBase(): string[] {
    const draftSlug = this.profile?.draft?.draftSlug;
    const base = this.tournamentBase();
    if (!base.length || !draftSlug) return [];
    return [...base, 'drafts', draftSlug];
  }

  get teamLink(): string[] {
    return [...this.tournamentBase(), 'teams', this.profile?.teamSlug ?? ''];
  }

  /** Public: every pool's teams on one page, no sign-up needed. */
  get teamsLink(): string[] {
    return [...this.tournamentBase(), 'teams'];
  }

  get scheduleLink(): string[] {
    return [...this.tournamentBase(), 'schedule'];
  }

  get standingsLink(): string[] {
    return [...this.tournamentBase(), 'standings'];
  }
}

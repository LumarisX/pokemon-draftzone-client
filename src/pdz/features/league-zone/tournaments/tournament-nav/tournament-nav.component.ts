import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { AuthService } from '@pdz/core/services/auth0.service';
import { LeagueManageService } from '@pdz/features/league-zone/league-manage/league-manage.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { getLeagueLogoUrl } from '@pdz/features/league-zone/league.util';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { catchError, of, switchMap } from 'rxjs';
import { tournamentLinkGroups } from '../tournament-links';

@Component({
  selector: 'pdz-tournament-nav',
  templateUrl: './tournament-nav.component.html',
  styleUrl: './tournament-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    IconComponent,
    SkeletonComponent,
    TeamLogoComponent,
  ],
})
export class TournamentNavComponent {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly authService = inject(AuthService);
  private readonly manageService = inject(LeagueManageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly leagueInfo = signal<League.LeagueInfo | null>(null);
  readonly leagueName = signal<string | null>(null);
  readonly profileLoaded = signal(false);
  readonly profile = signal<League.CoachProfile | null>(null);
  readonly canManage = signal(false);
  readonly draftStatus = signal<string | null>(null);

  readonly tournamentBase = computed(() => {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    if (!leagueSlug || !tournamentSlug) return [];
    return ['/', LEAGUE_ZONE_PATH, leagueSlug, 'tournaments', tournamentSlug];
  });

  readonly linkGroups = computed(() =>
    tournamentLinkGroups({
      base: this.tournamentBase(),
      profile: this.profile(),
      draftStatus: this.draftStatus(),
      canManage: this.canManage(),
    }),
  );

  readonly logoSrc = computed(() => getLeagueLogoUrl(this.leagueInfo()?.logo));

  readonly notJoinedDiscord = computed(() => {
    const profile = this.profile();
    return this.profileLoaded() && !!profile && !profile.inDiscordServer;
  });

  constructor() {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (info) => this.leagueInfo.set(info),
        error: () => this.leagueInfo.set(null),
      });

    this.leagueService
      .getLeague()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(),
      )
      .subscribe((league) => this.leagueName.set(league?.name ?? null));

    this.authService.isAuthenticated$
      .pipe(
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
        takeUntilDestroyed(),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.profileLoaded.set(true);
        if (profile?.pool) this.loadDraftStatus(profile.pool.poolSlug);
      });
  }

  private loadManageRoles(): void {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    if (!leagueSlug || !tournamentSlug) return;
    this.manageService
      .canManage(leagueSlug, tournamentSlug)
      .pipe(
        catchError(() => of([] as string[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((roles) => this.canManage.set(roles.includes('organizer')));
  }

  private loadDraftStatus(poolSlug: string): void {
    this.leagueService
      .getPoolDetails(poolSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
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
}

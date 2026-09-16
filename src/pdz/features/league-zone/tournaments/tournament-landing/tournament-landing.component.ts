import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PlusSignPipe } from '@pdz/shared/pipes/plus-sign.pipe';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '@pdz/core/services/auth0.service';
import {
  LeagueScheduleWidgetComponent,
  ScheduleRoundView,
} from '../../league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import {
  formatCountdown,
  getLeagueLogoUrl,
  getLogoUrl,
} from '../../league.util';

type Phase =
  | 'signup'
  | 'draft-soon'
  | 'drafting'
  | 'season-soon'
  | 'season'
  | 'complete';

interface PhaseView {
  phase: Phase;
  icon: string;
  label: string;
  countdown: string | null;
  tone: ChipTone;
}

interface StandingsRow {
  rank: number;
  name: string;
  coach: string;
  logo?: string;
  teamId: string;
  teamSlug?: string;
  wins: number;
  losses: number;
  diff: number;
}

const STANDINGS_PREVIEW_ROWS = 8;

@Component({
  selector: 'pdz-tournament-landing',
  templateUrl: './tournament-landing.component.html',
  styleUrl: './tournament-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    ButtonComponent,
    ChipComponent,
    IconComponent,
    LeagueScheduleWidgetComponent,
    PlusSignPipe,
    SkeletonComponent,
  ],
})
export class TournamentLandingComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly info = signal<League.LeagueInfo | null>(null);
  protected readonly leagueName = signal<string | null>(null);
  protected readonly profile = signal<League.CoachProfile | null>(null);
  protected readonly infoFailed = signal(false);

  protected readonly roundName = signal<string | null>(null);
  protected readonly roundDeadline = signal<string | null>(null);
  protected readonly roundLoaded = signal(false);
  private readonly rounds = signal<ScheduleRoundView[]>([]);

  protected readonly standings = signal<StandingsRow[] | null>(null);
  protected readonly standingsTotal = signal(0);

  private readonly now = signal(Date.now());

  protected readonly getTournamentLogoUrl = getLeagueLogoUrl;
  protected readonly getTeamLogoUrl = getLogoUrl;
  protected readonly skeletonRows = [0, 1, 2, 3, 4];

  protected readonly tournamentBase = computed(() => {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    if (!leagueSlug || !tournamentSlug) return [];
    return ['/leagues', leagueSlug, 'tournaments', tournamentSlug];
  });

  protected readonly leagueLink = computed(() => {
    const leagueSlug = this.leagueService.leagueSlug();
    return leagueSlug ? ['/leagues', leagueSlug] : [];
  });

  protected readonly facts = computed(() => {
    const info = this.info();
    if (!info) return [];
    const entries: { label: string; value: string }[] = [];

    const teams = this.standingsTotal();
    if (teams) entries.push({ label: 'Teams', value: `${teams}` });

    const draftCount = info.draftCount;
    if (draftCount) {
      entries.push({
        label: 'Picks',
        value:
          draftCount.min === draftCount.max
            ? `${draftCount.max}`
            : `${draftCount.min}–${draftCount.max}`,
      });
    }

    if (info.pointTotal) {
      entries.push({ label: 'Points', value: `${info.pointTotal}` });
    }

    return entries;
  });

  protected readonly signUpOpen = computed(() => {
    const deadline = this.info()?.signUpDeadline;
    return !!deadline && this.now() <= new Date(deadline).getTime();
  });

  protected readonly phaseView = computed<PhaseView | null>(() => {
    const info = this.info();
    if (!info) return null;
    const now = this.now();
    const at = (value?: Date | string) =>
      value ? new Date(value).getTime() : null;

    const signUp = at(info.signUpDeadline);
    const draftStart = at(info.draftStart);
    const draftEnd = at(info.draftEnd);
    const seasonStart = at(info.seasonStart);
    const seasonEnd = at(info.seasonEnd);

    const until = (target: number | null) =>
      target === null ? null : formatCountdown(target - now);

    if (signUp !== null && now <= signUp) {
      return {
        phase: 'signup',
        icon: 'how_to_reg',
        label: 'Sign-ups close in',
        countdown: until(signUp),
        tone: 'success',
      };
    }
    if (draftStart !== null && now < draftStart) {
      return {
        phase: 'draft-soon',
        icon: 'event_upcoming',
        label: 'Draft starts in',
        countdown: until(draftStart),
        tone: 'info',
      };
    }
    if (draftEnd !== null && now <= draftEnd) {
      return {
        phase: 'drafting',
        icon: 'sports_esports',
        label: 'Draft ends in',
        countdown: until(draftEnd),
        tone: 'warning',
      };
    }
    if (seasonStart !== null && now < seasonStart) {
      return {
        phase: 'season-soon',
        icon: 'event_upcoming',
        label: 'Season starts in',
        countdown: until(seasonStart),
        tone: 'info',
      };
    }
    if (seasonEnd !== null && now > seasonEnd) {
      return {
        phase: 'complete',
        icon: 'emoji_events',
        label: 'Season complete',
        countdown: null,
        tone: 'neutral',
      };
    }
    const deadline = at(this.roundDeadline() ?? undefined);
    return {
      phase: 'season',
      icon: 'schedule',
      label:
        deadline !== null && now <= deadline
          ? `${this.roundName() ?? 'This round'} ends in`
          : (this.roundName() ?? 'Season in progress'),
      countdown: deadline !== null && now <= deadline ? until(deadline) : null,
      tone: 'primary',
    };
  });

  ngOnInit(): void {
    const tick = setInterval(() => this.now.set(Date.now()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(tick));

    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (info) => this.info.set(info),
        error: () => this.infoFailed.set(true),
      });

    this.leagueService
      .getLeague()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
      )
      .subscribe((league) => this.leagueName.set(league?.name ?? null));

    this.loadStandings();

    this.auth.isAuthenticated$
      .pipe(
        switchMap((isAuthenticated) =>
          isAuthenticated
            ? this.leagueService
                .getCoachData({ suppressStatuses: [404] })
                .pipe(catchError(() => of(null)))
            : of(null),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profile) => this.profile.set(profile));
  }

  protected onRoundsLoaded(rounds: ScheduleRoundView[]): void {
    const round = rounds[0];
    this.rounds.set(rounds);
    this.roundName.set(round?.name ?? null);
    this.roundDeadline.set(round?.matchDeadline ?? null);
    this.roundLoaded.set(true);
  }

  private loadStandings(): void {
    this.leagueService
      .getStandings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
      )
      .subscribe((data) => {
        if (!data) {
          this.standings.set([]);
          return;
        }
        const view = data.views['all'] ?? Object.values(data.views)[0];
        const table = view?.teamStandings;
        if (!table) {
          this.standings.set([]);
          return;
        }
        this.standingsTotal.set(table.teams.length);
        this.standings.set(
          table.teams.slice(0, STANDINGS_PREVIEW_ROWS).map((team, index) => ({
            rank: index + 1,
            name: team.name,
            coach: team.coach,
            logo: team.logo,
            teamId: team.id,
            teamSlug: team.teamSlug || undefined,
            wins: team.wins,
            losses: team.losses,
            diff:
              table.diffMode === 'game' ? team.gameDiff : team.pokemonDiff,
          })),
        );
      });
  }
}

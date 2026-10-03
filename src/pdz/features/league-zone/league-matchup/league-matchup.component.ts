import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { VersusSide, orderForViewer } from '@pdz/core/utils/versus';
import { LeagueChatComponent } from '@pdz/features/league-zone/league-chat/league-chat.component';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { getNameByPid } from '@pdz/shared/data/namedex';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import {
  MatchTimeDialogComponent,
  MatchTimeDialogData,
  MatchTimeDialogResult,
} from '@pdz/shared/time/match-time-dialog/match-time-dialog.component';
import { formatExactTime } from '@pdz/shared/time/timezone';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import {
  MatchupDetail,
  MatchupGame,
  MatchupSideDetail,
  MatchupSideKey,
} from './league-matchup.model';
import { MatchupReportComponent } from './matchup-report/matchup-report.component';

type GameSlot = {
  id: string;
  name: string;
  status?: 'brought' | 'survived' | 'fainted';
  kills: number;
};

type StatusTone = { label: string; tone: ChipTone };

@Component({
  selector: 'pdz-league-matchup',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    IconComponent,
    SkeletonComponent,
    SpriteComponent,
    LeagueChatComponent,
    MatchupReportComponent,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    EmptyStateComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    CountdownComponent,
    TooltipDirective,
    PageHeaderComponent,
    TeamLogoComponent,
  ],
  templateUrl: './league-matchup.component.html',
  styleUrl: './league-matchup.component.scss',
})
export class LeagueMatchupComponent {
  private route = inject(ActivatedRoute);
  private leagueService = inject(LeagueZoneService);
  private dialogs = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  private clock = signal(Date.now());

  protected readonly logoSrc = getTeamLogoSrc;

  readonly matchup = signal<MatchupDetail | null>(null);
  readonly loading = signal(true);
  readonly skeletonSides = [0, 1];
  readonly loadError = signal<string | null>(null);
  readonly selectedGame = signal(0);
  readonly reportOpen = signal(false);
  readonly reviewing = signal(false);
  readonly reviewError = signal<string | null>(null);
  readonly copiedHandle = signal<string | null>(null);
  readonly schedulingError = signal<string | null>(null);

  readonly versus = computed(() => {
    const m = this.matchup();
    return m ? orderForViewer(m.team1, m.team2, m.viewer.side) : null;
  });

  readonly status = computed<StatusTone | null>(() => {
    const m = this.matchup();
    if (!m) return null;
    if (m.forfeit) return { label: 'Forfeit', tone: 'warning' };
    if (m.winner) return { label: 'Final', tone: 'success' };
    if (m.status === 'pending') return { label: 'Awaiting Review', tone: 'info' };
    return { label: 'Unplayed', tone: 'neutral' };
  });

  private matchupSlug = '';

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.matchupSlug = params['matchupSlug'];
      this.load();
    });

    const timer = setInterval(() => this.clock.set(Date.now()), 30000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  teamPath(teamSlug: string): string[] {
    return [
      '/',
      LEAGUE_ZONE_PATH,
      this.leagueService.leagueSlug() ?? '',
      'tournaments',
      this.leagueService.tournamentSlug() ?? '',
      'teams',
      teamSlug,
    ];
  }

  get matchupKey(): string {
    return this.matchupSlug;
  }

  load(): void {
    if (!this.matchupSlug) return;
    this.loading.set(true);
    this.loadError.set(null);
    this.leagueService
      .getMatchupDetail(this.matchupSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.matchup.set(detail);
          this.selectedGame.set(0);
          this.loading.set(false);
        },
        error: (error) => {
          this.loadError.set(error?.message || 'Failed to load this matchup.');
          this.loading.set(false);
        },
      });
  }

  headline(matchup: MatchupDetail): string {
    const parts = [matchup.round?.name, matchup.stage.name].filter(Boolean);
    if (matchup.label) parts.push(matchup.label);
    return parts.join(' · ') || 'Matchup';
  }

  isWinner(matchup: MatchupDetail, side: MatchupSideKey): boolean {
    if (!matchup.winner) return false;
    return matchup.winner.startsWith(side);
  }

  ownTeamIds(matchup: MatchupDetail): string[] {
    const side = matchup.viewer.side;
    if (!side) return [];
    return [side === 'side1' ? matchup.team1.id : matchup.team2.id];
  }

  localTime(side: MatchupSideDetail): string | null {
    if (!side.timezone) return null;
    this.clock();
    try {
      return new Date().toLocaleTimeString('en-US', {
        timeZone: side.timezone,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return side.timezone;
    }
  }

  handleFor(side: MatchupSideDetail): string | null {
    if (!side.discordName) return null;
    return side.discordName.startsWith('@')
      ? side.discordName
      : `@${side.discordName}`;
  }

  copyHandle(side: MatchupSideDetail): void {
    const handle = this.handleFor(side);
    if (!handle) return;
    navigator.clipboard
      .writeText(handle)
      .then(() => {
        this.copiedHandle.set(handle);
        setTimeout(() => {
          if (this.copiedHandle() === handle) this.copiedHandle.set(null);
        }, 2000);
      })
      .catch(() => this.copiedHandle.set(null));
  }

  scheduledLabel(matchup: MatchupDetail): string | null {
    const raw = matchup.scheduledDate ?? matchup.round?.matchDeadline;
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  scheduledExact(matchup: MatchupDetail): string | null {
    const raw = matchup.scheduledDate ?? matchup.round?.matchDeadline;
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : formatExactTime(date);
  }

  async editMatchTime(matchup: MatchupDetail): Promise<void> {
    const opponent =
      matchup.viewer.side === 'side2' ? matchup.team1 : matchup.team2;
    const own = matchup.viewer.side === 'side2' ? matchup.team2 : matchup.team1;

    const result = await this.dialogs.open<
      MatchTimeDialogComponent,
      MatchTimeDialogResult,
      MatchTimeDialogData
    >(MatchTimeDialogComponent, {
      heading: matchup.scheduledDate ? 'Edit Match Time' : 'Set Match Time',
      subheading: `${matchup.team1.name} vs ${matchup.team2.name}`,
      size: 'lg',
      data: {
        opponentName: opponent.name,
        scheduledDate: matchup.scheduledDate ?? null,
        opponentTimezone: opponent.timezone,
        localTimezone: matchup.viewer.side ? own.timezone : null,
      },
    }).closed;

    if (!result) return;

    this.schedulingError.set(null);
    this.leagueService
      .setMatchupSchedule(this.matchupSlug, result.scheduledDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: (error) =>
          this.schedulingError.set(
            error?.message || 'Failed to save the match time.',
          ),
      });
  }

  replayOf(game: MatchupGame): string | null {
    return game.link?.trim() || null;
  }

  gameTeam(
    game: MatchupGame,
    side: VersusSide<MatchupSideDetail>,
  ): MatchupGame['team1'] {
    return side.stored === 'side1' ? game.team1 : game.team2;
  }

  gameSlots(team: League.MatchTeamStats): GameSlot[] {
    return Object.entries(team).map(([id, stats]) => ({
      id,
      name: getNameByPid(id),
      status: stats.status,
      kills: (stats.kills?.direct || 0) + (stats.kills?.indirect || 0),
    }));
  }

  gameLabel(
    game: MatchupGame,
    index: number,
    versus: { team1: VersusSide<MatchupSideDetail>; team2: VersusSide<MatchupSideDetail> },
  ): string {
    const first = this.gameTeam(game, versus.team1).score;
    const second = this.gameTeam(game, versus.team2).score;
    return `Game ${index + 1} · ${first}–${second}`;
  }

  selectGame(index: number): void {
    this.selectedGame.set(index);
  }

  toggleReport(): void {
    this.reportOpen.update((open) => !open);
  }

  onReported(): void {
    this.reportOpen.set(false);
    this.load();
  }

  review(decision: 'approve' | 'reject'): void {
    if (this.reviewing()) return;
    this.reviewing.set(true);
    this.reviewError.set(null);
    this.leagueService
      .reviewMatchupReport(this.matchupSlug, decision)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reviewing.set(false);
          this.load();
        },
        error: (error) => {
          this.reviewing.set(false);
          this.reviewError.set(
            error?.message || 'Failed to review the report.',
          );
        },
      });
  }

  reportSummary(matchup: MatchupDetail): string {
    const report = matchup.report;
    if (!report) return '';
    const submitted = new Date(report.submittedAt);
    const when = Number.isNaN(submitted.getTime())
      ? ''
      : ` on ${submitted.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`;
    const forfeit = report.forfeit ? ' (forfeit)' : '';
    return `${report.submittedByName} reported ${report.score.team1}–${report.score.team2}${forfeit}${when}`;
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { getNameByPid, PokemonId } from '@pdz/shared/data/namedex';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { Subject, takeUntil } from 'rxjs';
import { League } from '../league.interface';
import { getLogoUrl } from '../league.util';
import { LeagueZoneService } from '../league-zone.service';
import {
  MatchupDetail,
  MatchupGame,
  MatchupSideDetail,
  MatchupSideKey,
} from './league-matchup.model';
import { LeagueChatComponent } from '../league-chat/league-chat.component';
import { MatchupReportComponent } from './matchup-report/matchup-report.component';

type GameSlot = {
  id: PokemonId;
  name: string;
  status?: 'brought' | 'survived' | 'fainted';
  kills: number;
};

@Component({
  selector: 'pdz-league-matchup',
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    LoadingComponent,
    SpriteComponent,
    LeagueChatComponent,
    MatchupReportComponent,
  ],
  templateUrl: './league-matchup.component.html',
  styleUrl: './league-matchup.component.scss',
})
export class LeagueMatchupComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();
  private clock = signal(Date.now());
  private clockTimer?: ReturnType<typeof setInterval>;

  protected readonly getLogoUrl = getLogoUrl;

  matchup = signal<MatchupDetail | null>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);
  selectedGame = signal(0);
  reportOpen = signal(false);
  reviewing = signal(false);
  reviewError = signal<string | null>(null);
  copiedHandle = signal<string | null>(null);

  private matchupSlug = '';

  constructor() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.matchupSlug = params['matchupSlug'];
      this.load();
    });

    this.clockTimer = setInterval(() => this.clock.set(Date.now()), 30000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  schedulePath = computed(() => [
    '/leagues',
    this.leagueService.leagueSlug() ?? '',
    'tournaments',
    this.leagueService.tournamentSlug() ?? '',
    'schedule',
  ]);

  teamPath(teamSlug: string): string[] {
    return [
      '/leagues',
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
      .pipe(takeUntil(this.destroy$))
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

  statusLabel(matchup: MatchupDetail): string {
    if (matchup.forfeit) return 'Forfeit';
    if (matchup.winner) return 'Final';
    if (matchup.status === 'pending') return 'Awaiting review';
    return 'Unplayed';
  }

  isWinner(matchup: MatchupDetail, side: MatchupSideKey): boolean {
    if (!matchup.winner) return false;
    return matchup.winner.startsWith(side);
  }

  sideOf(matchup: MatchupDetail, side: MatchupSideKey): MatchupSideDetail {
    return side === 'side1' ? matchup.team1 : matchup.team2;
  }

  ownTeamIds(matchup: MatchupDetail): string[] {
    const side = matchup.viewer.side;
    return side ? [this.sideOf(matchup, side).id] : [];
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

  scheduledIsDeadline(matchup: MatchupDetail): boolean {
    return !matchup.scheduledDate && !!matchup.round?.matchDeadline;
  }

  replayOf(game: MatchupGame): string | null {
    return game.link?.trim() || null;
  }

  gameSlots(team: League.MatchTeamStats): GameSlot[] {
    return Object.entries(team).map(([id, stats]) => ({
      id: id as PokemonId,
      name: getNameByPid(id as PokemonId),
      status: stats.status,
      kills: (stats.kills?.direct || 0) + (stats.kills?.indirect || 0),
    }));
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
      .pipe(takeUntil(this.destroy$))
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

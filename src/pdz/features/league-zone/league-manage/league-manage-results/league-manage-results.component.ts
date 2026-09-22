import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { ScoreComponent } from '@pdz/shared/data/score/score.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { MatchupReportComponent } from '../../league-matchup/matchup-report/matchup-report.component';
import { MatchupDetail } from '../../league-matchup/league-matchup.model';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { LeagueManageService } from '../league-manage.service';

type ResultsScope = 'attention' | 'all';

type ResultRow = {
  matchup: League.Matchup;
  stageName: string | null;
  pending: boolean;
  recorded: boolean;
  blocked: boolean;
};

type ResultRound = {
  id: string;
  name: string;
  matchDeadline?: string | null;
  live: boolean;
  rows: ResultRow[];
  pendingCount: number;
  openCount: number;
};

@Component({
  selector: 'pdz-league-manage-results',
  imports: [
    DatePipe,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    DisclosureComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    LoadingComponent,
    MatchupReportComponent,
    PageHeaderComponent,
    ScoreComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './league-manage-results.component.html',
  styleUrl: './league-manage-results.component.scss',
})
export class LeagueManageResultsComponent {
  private readonly manageService = inject(LeagueManageService);
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly scope = signal<ResultsScope>('attention');
  protected readonly reviewOnly = signal(false);

  private readonly schedule = signal<League.ScheduleRound[]>([]);
  private readonly currentRoundIndex = signal(-1);
  private readonly openRoundIds = signal<ReadonlySet<string>>(new Set());

  protected readonly openSlug = signal<string | null>(null);
  protected readonly detail = signal<MatchupDetail | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly detailError = signal<string | null>(null);

  protected readonly reviewingSlug = signal<string | null>(null);
  protected readonly advancingSlug = signal<string | null>(null);
  protected readonly rowError = signal<{ slug: string; message: string } | null>(
    null,
  );

  private readonly rounds = computed<ResultRound[]>(() =>
    this.schedule().map((round, index) => {
      const multiStage = round.stages.length > 1;
      const rows = round.stages
        .flatMap((stage) =>
          stage.matchups.map((matchup) => this.toRow(matchup, stage, multiStage)),
        )
        .sort((a, b) => this.priority(a) - this.priority(b));

      return {
        id: round._id,
        name: round.name,
        matchDeadline: round.matchDeadline,
        live: index === this.currentRoundIndex(),
        rows,
        pendingCount: rows.filter((row) => row.pending).length,
        openCount: rows.filter((row) => !row.recorded && !row.pending).length,
      };
    }),
  );

  protected readonly pendingTotal = computed(() =>
    this.rounds().reduce((total, round) => total + round.pendingCount, 0),
  );

  protected readonly openTotal = computed(() =>
    this.rounds().reduce((total, round) => total + round.openCount, 0),
  );

  protected readonly visibleRounds = computed(() => {
    const reviewOnly = this.reviewOnly();
    const scope = this.scope();
    if (!reviewOnly && scope === 'all') return this.rounds();

    return this.rounds()
      .map((round) => ({
        ...round,
        rows: round.rows.filter((row) =>
          reviewOnly ? row.pending : this.needsAttention(row),
        ),
      }))
      .filter((round) => round.rows.length > 0);
  });

  protected readonly isEmpty = computed(
    () => !this.loading() && this.visibleRounds().length === 0,
  );

  protected readonly emptyHeading = computed(() => {
    if (this.reviewOnly()) return 'No reports waiting';
    if (this.scope() === 'all') return 'No matches yet';
    return 'Nothing needs you right now';
  });

  protected readonly emptyMessage = computed(() => {
    if (this.reviewOnly()) return 'Every coach report has been reviewed.';
    if (this.scope() === 'all')
      return 'Build the schedule first and the matches will show up here.';
    return 'Every match has a result. Switch to All matches to edit one anyway.';
  });

  constructor() {
    this.load();
  }

  protected toggleReviewOnly(): void {
    this.reviewOnly.update((only) => !only);
  }

  protected isRoundOpen(round: ResultRound): boolean {
    return this.openRoundIds().has(round.id);
  }

  protected toggleRound(round: ResultRound): void {
    this.openRoundIds.update((open) => {
      const next = new Set(open);
      if (!next.delete(round.id)) next.add(round.id);
      return next;
    });
  }

  protected isRowOpen(row: ResultRow): boolean {
    return this.openSlug() === row.matchup.slug;
  }

  protected toggleRow(row: ResultRow): void {
    if (this.isRowOpen(row)) {
      this.closeRow();
      return;
    }

    const slug = row.matchup.slug;
    this.openSlug.set(slug);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);

    this.leagueService
      .getMatchupDetail(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          if (this.openSlug() !== slug) return;
          this.detail.set(detail);
          this.detailLoading.set(false);
        },
        error: (error) => {
          if (this.openSlug() !== slug) return;
          this.detailLoading.set(false);
          this.detailError.set(
            error?.message || 'Could not load that matchup.',
          );
        },
      });
  }

  protected closeRow(): void {
    this.openSlug.set(null);
    this.detail.set(null);
    this.detailError.set(null);
  }

  protected onRecorded(): void {
    this.closeRow();
    this.load();
  }

  protected review(row: ResultRow, decision: 'approve' | 'reject'): void {
    if (this.reviewingSlug()) return;

    this.reviewingSlug.set(row.matchup.slug);
    this.rowError.set(null);

    this.leagueService
      .reviewMatchupReport(row.matchup.slug, decision)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reviewingSlug.set(null);
          if (this.isRowOpen(row)) this.closeRow();
          this.load();
        },
        error: (error) => {
          this.reviewingSlug.set(null);
          this.rowError.set({
            slug: row.matchup.slug,
            message: error?.message || 'Could not review that report.',
          });
        },
      });
  }

  protected advancementValue(row: ResultRow): string {
    return row.matchup.advances ?? '';
  }

  protected setAdvancement(row: ResultRow, value: string): void {
    if (this.advancingSlug()) return;
    const advances =
      value === 'side1' || value === 'side2' || value === 'none' ? value : null;

    this.advancingSlug.set(row.matchup.slug);
    this.rowError.set(null);

    this.manageService
      .setMatchupAdvancement(row.matchup.slug, advances)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.advancingSlug.set(null);
          this.load();
        },
        error: (error) => {
          this.advancingSlug.set(null);
          this.rowError.set({
            slug: row.matchup.slug,
            message: error?.message || 'Could not set the advancement.',
          });
        },
      });
  }

  protected errorFor(row: ResultRow): string | null {
    const error = this.rowError();
    return error?.slug === row.matchup.slug ? error.message : null;
  }

  protected reportSummary(row: ResultRow): string {
    const report = row.matchup.report;
    if (!report) return '';
    const submitted = new Date(report.submittedAt);
    const when = Number.isNaN(submitted.getTime())
      ? ''
      : ` · ${submitted.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`;
    const forfeit = report.forfeit ? ' (forfeit)' : '';
    return `${report.submittedByName} reported ${report.score.team1}–${report.score.team2}${forfeit}${when}`;
  }

  protected scoreLine(row: ResultRow): string | null {
    if (!row.recorded) return null;
    return `${row.matchup.team1.score ?? 0}–${row.matchup.team2.score ?? 0}`;
  }

  protected outcomeLabel(row: ResultRow): string | null {
    const { winner, team1, team2 } = row.matchup;
    switch (winner) {
      case 'side1':
        return `${team1.name} won`;
      case 'side2':
        return `${team2.name} won`;
      case 'side1ffw':
        return `${team1.name} won by forfeit`;
      case 'side2ffw':
        return `${team2.name} won by forfeit`;
      case 'dffl':
        return 'Double forfeit';
      case 'draw':
        return 'Draw';
      default:
        return null;
    }
  }

  private toRow(
    matchup: League.Matchup,
    stage: League.ScheduleRound['stages'][number],
    multiStage: boolean,
  ): ResultRow {
    return {
      matchup,
      stageName: multiStage ? stage.name : null,
      pending: matchup.status === 'pending' && !!matchup.report,
      recorded: this.isRecorded(matchup),
      blocked: !!matchup.advancementBlocked || !!matchup.advances,
    };
  }

  private isRecorded(matchup: League.Matchup): boolean {
    return (
      !!matchup.winner ||
      (matchup.team1.score ?? 0) > 0 ||
      (matchup.team2.score ?? 0) > 0 ||
      matchup.matches.some((match) => match.link?.trim())
    );
  }

  private needsAttention(row: ResultRow): boolean {
    return row.pending || row.blocked || !row.recorded;
  }

  private priority(row: ResultRow): number {
    if (row.pending) return 0;
    if (row.blocked) return 1;
    if (!row.recorded) return 2;
    return 3;
  }

  private load(): void {
    this.manageService
      .getSchedule()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ rounds, currentRoundIndex }) => {
          this.schedule.set(rounds);
          this.currentRoundIndex.set(currentRoundIndex ?? -1);
          this.loading.set(false);
          if (!this.pendingTotal()) this.reviewOnly.set(false);
          this.openRoundIds.update((open) =>
            open.size ? open : this.defaultOpenRounds(),
          );
        },
        error: (error) => {
          this.loading.set(false);
          this.loadError.set(
            error?.message || 'Could not load the schedule.',
          );
        },
      });
  }

  private defaultOpenRounds(): ReadonlySet<string> {
    const rounds = this.rounds();
    const withPending = rounds.filter((round) => round.pendingCount > 0);
    if (withPending.length) {
      return new Set(withPending.map((round) => round.id));
    }

    const live = rounds.find((round) => round.live);
    if (live) return new Set([live.id]);

    const firstOpen = rounds.find((round) => round.openCount > 0);
    return new Set(firstOpen ? [firstOpen.id] : []);
  }
}

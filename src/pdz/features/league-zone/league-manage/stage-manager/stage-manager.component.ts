import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { finalize, Subject, take, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';

/**
 * The server's BRACKET_STAGE_TYPES. Bracket generation is the only code path
 * that creates matchups, so a stage of any other type can never hold one —
 * hence these are the only types offered here.
 */
const BRACKET_TYPES: League.StageType[] = [
  'single-elimination',
  'double-elimination',
  'custom',
];

@Component({
  selector: 'pdz-stage-manager',
  imports: [CommonModule, RouterModule, LoadingComponent, IconComponent],
  templateUrl: './stage-manager.component.html',
  styleUrl: './stage-manager.component.scss',
})
export class StageManagerComponent implements OnInit, OnDestroy {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly stageTypes: {
    value: League.StageType;
    label: string;
    hint: string;
  }[] = [
    // Every type builds its bracket section by section; the type only sets the
    // format the first section defaults to, and labels the stage publicly.
    {
      value: 'custom',
      label: 'Custom',
      hint: 'Mix formats freely — a group phase feeding a playoff, or a plain regular season.',
    },
    {
      value: 'single-elimination',
      label: 'Single Elimination',
      hint: 'A knockout stage. Sections default to single elimination.',
    },
    {
      value: 'double-elimination',
      label: 'Double Elimination',
      hint: 'A winners/losers stage. Sections default to double elimination, with an optional grand finals reset.',
    },
  ];

  loading = true;
  submitting = false;
  submitError = '';
  /** Stage id whose visibility toggle is mid-flight. */
  togglingId: string | null = null;
  toggleError = '';

  stages: League.StageSummary[] = [];

  name = '';
  type: League.StageType = 'custom';
  /** New stages start hidden so a bracket can be built before it goes live. */
  isPublic = false;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get managePath(): string {
    return `/leagues/${this.leagueService.leagueSlug()}/tournaments/${this.leagueService.tournamentSlug()}/manage`;
  }

  get nextOrder(): number {
    return (
      this.stages.reduce((max, stage) => Math.max(max, stage.order), 0) + 1
    );
  }

  get typeHint(): string {
    return this.stageTypes.find((option) => option.value === this.type)!.hint;
  }

  get canSubmit(): boolean {
    return !this.submitting && this.name.trim().length > 0;
  }

  typeLabel(type: string): string {
    return (
      this.stageTypes.find((option) => option.value === type)?.label ??
      type
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  }

  hasBracket(stage: League.StageSummary): boolean {
    return BRACKET_TYPES.includes(stage.type as League.StageType);
  }

  createStage(): void {
    if (!this.canSubmit) return;

    this.submitting = true;
    this.submitError = '';

    this.leagueService
      .createStage({
        name: this.name.trim(),
        type: this.type,
        order: this.nextOrder,
        public: this.isPublic,
      })
      .pipe(
        take(1),
        finalize(() => {
          this.submitting = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (stage) => {
          // Straight into the builder — a stage isn't usable until it has
          // rounds and matchups, and only the bracket canvas creates those.
          this.router.navigateByUrl(
            `${this.managePath}/stages/${stage._id}/bracket`,
          );
        },
        error: (err) => {
          this.submitError = err?.message || 'Could not create the stage.';
        },
      });
  }

  toggleVisibility(stage: League.StageSummary): void {
    if (this.togglingId) return;

    const next = !stage.public;
    this.togglingId = stage._id;
    this.toggleError = '';

    this.leagueService
      .setStageVisibility(stage._id, next)
      .pipe(
        take(1),
        finalize(() => {
          this.togglingId = null;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          stage.public = next;
        },
        error: (err) => {
          this.toggleError =
            err?.message || `Could not ${next ? 'show' : 'hide'} the stage.`;
        },
      });
  }

  private load(): void {
    this.loading = true;
    this.leagueService
      .listStages()
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (stages) => {
          this.stages = [...stages].sort((a, b) => a.order - b.order);
        },
      });
  }
}

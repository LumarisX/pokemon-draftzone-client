import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, of, Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { getLogoUrlOld } from '../../league.util';

@Component({
  selector: 'pdz-tournament-nav',
  templateUrl: './tournament-nav.component.html',
  styleUrl: './tournament-nav.component.scss',
  imports: [CommonModule, RouterModule],
})
export class TournamentNavComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  leagueInfo: League.LeagueInfo | null = null;
  profile: League.CoachProfile | null = null;
  stages: League.StageSummary[] = [];
  selectedStageId: string | null = null;

  draftStatus: string | null = null;

  getTournamentLogoUrl = getLogoUrlOld('league-uploads');

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => (this.leagueInfo = info),
        error: (error) => console.error('Error fetching league info:', error),
      });

    this.leagueService
      .getCoachData({ suppressStatuses: [404] })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe((profile) => {
        this.profile = profile;
        if (profile?.draft) {
          this.loadStages();
          this.loadDraftStatus(profile.draft.draftKey);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDraftStatus(draftKey: string): void {
    this.leagueService
      .getDraftDetails(draftKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.draftStatus = this.ongoingDraftLabel(details.status);
        },
        error: () => {
          this.draftStatus = null;
        },
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

  private loadStages(): void {
    this.leagueService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stages) => {
          this.stages = stages;
          if (stages.length) {
            this.selectedStageId = stages[0]._id;
          }
        },
      });
  }

  private get leagueKey() {
    return this.leagueService.leagueKey();
  }

  private get tournamentKey() {
    return this.leagueService.tournamentKey();
  }

  tournamentBase(): string[] {
    const { leagueKey, tournamentKey } = this;
    if (!leagueKey || !tournamentKey) return [];
    return ['/leagues', leagueKey, 'tournaments', tournamentKey];
  }

  get draftBase(): string[] {
    const draftKey = this.profile?.draft?.draftKey;
    const base = this.tournamentBase();
    if (!base.length || !draftKey) return [];
    return [...base, 'drafts', draftKey];
  }

  get stageBase(): string[] {
    const base = this.tournamentBase();
    if (!base.length || !this.selectedStageId) return [];
    return [...base, 'stages', this.selectedStageId];
  }

  get teamLink(): string[] {
    return [...this.draftBase, 'teams', this.profile?.teamId ?? ''];
  }

  get scheduleLink(): string[] {
    return [...this.stageBase, 'schedule'];
  }

  get standingsLink(): string[] {
    return [...this.stageBase, 'standings'];
  }
}

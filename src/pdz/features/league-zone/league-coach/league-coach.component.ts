import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueZoneService } from '../league-zone.service';
import { StageSwitcherComponent } from '../league-widgets/stage-switcher/stage-switcher.component';
import { League } from '../league.interface';
import { getLogoUrl } from '../league.util';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

@Component({
  selector: 'pdz-league-coach',
  imports: [
    CommonModule,
    RouterModule,
    LoadingComponent,
    IconComponent,
    StageSwitcherComponent,
  ],
  templateUrl: './league-coach.component.html',
  styleUrl: './league-coach.component.scss',
})
export class LeagueCoachComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  profile: League.CoachProfile | null = null;
  leagueInfo: League.LeagueInfo | null = null;
  isLoading = true;
  error = false;
  getLogoUrl = getLogoUrl;

  stages: League.StageSummary[] = [];
  selectedStageId: string | null = null;

  get draftBase(): string[] {
    const { leagueKey, tournamentKey } = this;
    const draftKey = this.profile?.draft?.draftKey;
    if (!leagueKey || !tournamentKey || !draftKey) return [];
    return [
      '/leagues',
      leagueKey,
      'tournaments',
      tournamentKey,
      'drafts',
      draftKey,
    ];
  }

  get stageBase(): string[] {
    const { leagueKey, tournamentKey, selectedStageId } = this;
    if (!leagueKey || !tournamentKey || !selectedStageId) return [];
    return [
      '/leagues',
      leagueKey,
      'tournaments',
      tournamentKey,
      'stages',
      selectedStageId,
    ];
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

  ngOnInit(): void {
    this.leagueService
      .getCoachData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isLoading = false;
        },
        error: () => {
          this.error = true;
          this.isLoading = false;
        },
      });

    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => (this.leagueInfo = info),
        error: () => {},
      });

    this.leagueService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stages) => {
          this.stages = stages;
          if (stages.length === 1) {
            this.selectedStageId = stages[0]._id;
          }
        },
      });
  }

  onStageSelected(stageId: string): void {
    this.selectedStageId = stageId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueZoneService } from '../../league-zone.service';
import { LeagueScheduleWidgetComponent } from '../../league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueTradeWidgetComponent } from '../../league-widgets/league-trade-widget/league-trade-widget.component';
import { StageSwitcherComponent } from '../../league-widgets/stage-switcher/stage-switcher.component';
import { League } from '../../league.interface';
import { getLogoUrlOld } from '../../league.util';

@Component({
  selector: 'pdz-division-dashboard',
  imports: [
    RouterModule,
    IconComponent,
    LeagueTradeWidgetComponent,
    LeagueScheduleWidgetComponent,
    StageSwitcherComponent,
  ],
  templateUrl: './division-dashboard.component.html',
  styleUrls: ['./division-dashboard.component.scss'],
})
export class DivisionDashboardComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  team?: League.LeagueTeam;
  matchups: League.Matchup[] = [];
  tournamentId?: string;
  leagueName = '';
  divisionName = '';
  logo?: string;
  matchupStage?: League.Stage = undefined;

  // This page is draft-scoped (drafts/:draftKey), not stage-scoped, so
  // leagueZoneService.stageId() (route-derived) is always null here. Resolve
  // a real default — the tournament's first stage — for the embedded
  // schedule/trade widgets and the switcher's initial selection.
  private readonly selectedStageId = signal<string | null>(null);

  ngOnInit(): void {
    this.leagueZoneService
      .getDraftDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((details) => {
        this.leagueName = details.leagueName;
        this.divisionName = details.divisionName;
        this.logo = details.logo;
      });

    this.leagueZoneService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stages) => {
        this.selectedStageId.set(stages[0]?._id ?? null);
      });
  }

  getLogoUrl = getLogoUrlOld('league-uploads');

  get tournamentKey(): string {
    return this.leagueZoneService.tournamentKey() || '';
  }

  get draftKey(): string {
    return this.leagueZoneService.draftKey() || '';
  }

  get stageId(): string | null {
    return this.selectedStageId();
  }

  onStageSelected(stageId: string): void {
    this.selectedStageId.set(stageId);
    this.router.navigate([
      '/leagues',
      this.leagueZoneService.leagueKey(),
      'tournaments',
      this.tournamentKey,
      'stages',
      stageId,
      'schedule',
    ]);
  }

  navigateTo(route: string[]): void {
    this.router.navigate(route);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

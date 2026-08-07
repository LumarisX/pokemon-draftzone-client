import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueZoneService } from '../../league-zone.service';
import { LeagueScheduleWidgetComponent } from '../../league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueTradeWidgetComponent } from '../../league-widgets/league-trade-widget/league-trade-widget.component';
import { StageSwitcherComponent } from '../../league-widgets/stage-switcher/stage-switcher.component';
import { League } from '../../league.interface';
import { getLeagueLogoUrl } from '../../league.util';

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
  leagueName = '';
  divisionName = '';
  logo?: string;
  matchupStage?: League.Stage = undefined;

  // This page is draft-scoped (drafts/:draftSlug), not stage-scoped, so
  // leagueZoneService.stageSlug() (route-derived) is always null here. Resolve
  // a real default — the tournament's first stage — for the embedded
  // schedule/trade widgets and the switcher's initial selection.
  private readonly selectedStageSlug = signal<string | null>(null);

  ngOnInit(): void {
    this.leagueZoneService
      .getDraftDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((details) => {
        this.leagueName = details.leagueName;
        this.divisionName = details.draftName;
        this.logo = details.logo;
      });

    this.leagueZoneService
      .listStages()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stages) => {
        this.selectedStageSlug.set(stages[0]?.slug ?? null);
      });
  }

  getLogoUrl = getLeagueLogoUrl;

  get tournamentSlug(): string {
    return this.leagueZoneService.tournamentSlug() || '';
  }

  get draftSlug(): string {
    return this.leagueZoneService.draftSlug() || '';
  }

  get stageSlug(): string | null {
    return this.selectedStageSlug();
  }

  onStageSelected(stageSlug: string): void {
    this.selectedStageSlug.set(stageSlug);
    this.router.navigate([
      '/leagues',
      this.leagueZoneService.leagueSlug(),
      'tournaments',
      this.tournamentSlug,
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

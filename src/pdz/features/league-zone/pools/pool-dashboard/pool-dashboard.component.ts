import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { TabNavLinkComponent } from '@pdz/shared/layout/tab-nav/tab-nav-link.component';
import { TabNavComponent } from '@pdz/shared/layout/tab-nav/tab-nav.component';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { LeagueScheduleWidgetComponent } from '../../league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueTradeWidgetComponent } from '../../league-widgets/league-trade-widget/league-trade-widget.component';
import { StageSwitcherComponent } from '../../league-widgets/stage-switcher/stage-switcher.component';
import { League } from '../../league.interface';
import { getLeagueLogoUrl } from '../../league.util';

@Component({
  selector: 'pdz-pool-dashboard',
  imports: [
    RouterModule,
    TabNavComponent,
    TabNavLinkComponent,
    LeagueTradeWidgetComponent,
    LeagueScheduleWidgetComponent,
    StageSwitcherComponent,
    PageHeaderComponent,
  ],
  templateUrl: './pool-dashboard.component.html',
  styleUrls: ['./pool-dashboard.component.scss'],
})
export class PoolDashboardComponent implements OnInit, OnDestroy {
  private leagueZoneService = inject(LeagueZoneService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  team?: League.LeagueTeam;
  leagueName = '';
  poolName = '';
  logo?: string;
  matchupStage?: League.Stage = undefined;

  private readonly selectedStageSlug = signal<string | null>(null);

  ngOnInit(): void {
    this.leagueZoneService
      .getPoolDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((details) => {
        this.leagueName = details.leagueName;
        this.poolName = details.poolName;
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

  get poolSlug(): string {
    return this.leagueZoneService.poolSlug() || '';
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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { LeagueScheduleWidgetComponent } from '@pdz/features/league-zone/league-widgets/league-schedule-widget/league-schedule-widget.component';
import { LeagueTradeWidgetComponent } from '@pdz/features/league-zone/league-widgets/league-trade-widget/league-trade-widget.component';
import { StageSwitcherComponent } from '@pdz/features/league-zone/league-widgets/stage-switcher/stage-switcher.component';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { getLeagueLogoUrl } from '@pdz/features/league-zone/league.util';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TabNavLinkComponent } from '@pdz/shared/layout/tab-nav/tab-nav-link.component';
import { TabNavComponent } from '@pdz/shared/layout/tab-nav/tab-nav.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'pdz-pool-dashboard',
  imports: [
    CardComponent,
    LeagueScheduleWidgetComponent,
    LeagueTradeWidgetComponent,
    PageComponent,
    PageHeaderComponent,
    RouterLink,
    RouterLinkActive,
    StageSwitcherComponent,
    TabNavComponent,
    TabNavLinkComponent,
  ],
  templateUrl: './pool-dashboard.component.html',
  styleUrl: './pool-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolDashboardComponent {
  private readonly leagueZoneService = inject(LeagueZoneService);
  private readonly router = inject(Router);

  readonly details = toSignal(
    this.leagueZoneService.getPoolDetails().pipe(catchError(() => of(null))),
  );

  private readonly stages = toSignal(
    this.leagueZoneService.listStages().pipe(catchError(() => of([]))),
  );

  readonly stageSlug = linkedSignal(() => this.stages()?.[0]?.slug ?? null);

  readonly logoUrl = computed(() => getLeagueLogoUrl(this.details()?.logo));

  onStageSelected(stageSlug: string): void {
    this.stageSlug.set(stageSlug);
    this.router.navigate([
      '/',
      LEAGUE_ZONE_PATH,
      this.leagueZoneService.leagueSlug(),
      'tournaments',
      this.leagueZoneService.tournamentSlug(),
      'schedule',
    ]);
  }
}

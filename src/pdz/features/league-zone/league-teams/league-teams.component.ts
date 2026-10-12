import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, map, of } from 'rxjs';
import { waitingMessage } from '../tournament-milestones';
import { LeagueTeamCardComponent } from './league-team-card/league-team-card.component';

type PoolGroup = {
  poolSlug: string | null;
  name: string;
  teams: League.LeagueTeam[];
};

@Component({
  selector: 'pdz-league-teams',
  imports: [
    EmptyStateComponent,
    LeagueTeamCardComponent,
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  templateUrl: './league-teams.component.html',
  styleUrl: './league-teams.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueTeamsComponent {
  private readonly leagueService = inject(LeagueZoneService);

  readonly pools = toSignal(
    this.leagueService.getTeamsByPool().pipe(
      map((data): PoolGroup[] => data.pools),
      catchError(() => of<PoolGroup[]>([])),
    ),
  );

  private readonly info = toSignal(
    this.leagueService.getLeagueInfo().pipe(catchError(() => of(null))),
  );

  readonly noTeamsMessage = computed(() =>
    waitingMessage('Teams appear here once coaches are approved.', this.info()),
  );

  readonly emptyPoolMessage = computed(() =>
    waitingMessage(
      'Organizers place teams in pools after sign-ups.',
      this.info(),
    ),
  );

  readonly selected = linkedSignal(() => {
    const first = this.pools()?.[0];
    return first ? this.groupKey(first) : null;
  });

  readonly activeGroup = computed(() => {
    const groups = this.pools();
    if (!groups?.length) return undefined;
    const key = this.selected();
    return groups.find((group) => this.groupKey(group) === key) ?? groups[0];
  });

  groupKey(group: PoolGroup): string {
    return group.poolSlug ?? '';
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  PageSection,
  PageSectionsComponent,
} from '@pdz/shared/layout/page-sections/page-sections.component';
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
    ButtonComponent,
    EmptyStateComponent,
    RouterLink,
    LeagueTeamCardComponent,
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
    PageSectionsComponent,
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

  readonly onlyPool = computed(() => {
    const groups = this.pools();
    return groups?.length === 1 ? groups[0] : null;
  });

  readonly sections = computed<PageSection[]>(() =>
    (this.pools() ?? []).map((group) => ({
      id: this.sectionId(group),
      label: group.name,
      count: group.teams.length,
    })),
  );

  groupKey(group: PoolGroup): string {
    return group.poolSlug ?? '';
  }

  sectionId(group: PoolGroup): string {
    return `pool-${group.poolSlug ?? 'unassigned'}`;
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { LeagueTeamCardComponent } from './league-team-card/league-team-card.component';

type PoolGroup = {
  poolSlug: string | null;
  name: string;
  teams: League.LeagueTeam[];
};

@Component({
  selector: 'pdz-league-teams',
  imports: [
    LeagueTeamCardComponent,
    LoadingComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  templateUrl: './league-teams.component.html',
  styleUrls: ['./league-teams.component.scss'],
})
export class LeagueTeamsComponent implements OnInit {
  leagueService = inject(LeagueZoneService);

  readonly pools = signal<PoolGroup[] | undefined>(undefined);
  readonly selected = signal<string | null>(null);

  readonly activeGroup = computed(() => {
    const groups = this.pools();
    if (!groups?.length) return undefined;
    const key = this.selected();
    return groups.find((group) => this.groupKey(group) === key) ?? groups[0];
  });

  ngOnInit(): void {
    this.leagueService.getTeamsByPool().subscribe((data) => {
      this.pools.set(data.pools);
      this.selected.set(data.pools.length ? this.groupKey(data.pools[0]) : null);
    });
  }

  groupKey(group: PoolGroup): string {
    return group.poolSlug ?? '';
  }
}

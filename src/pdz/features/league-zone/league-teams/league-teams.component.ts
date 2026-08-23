import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { LeagueTeamCardComponent } from './league-team-card/league-team-card.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';

type DraftGroup = {
  draftSlug: string | null;
  name: string;
  teams: League.LeagueTeam[];
};

@Component({
  selector: 'pdz-league-teams',
  imports: [
    LeagueTeamCardComponent,
    LoadingComponent,
    RouterModule,
    ButtonComponent,
    IconComponent,
    DisclosureComponent,
  ],
  templateUrl: './league-teams.component.html',
  styleUrls: ['./league-teams.component.scss'],
})
export class LeagueTeamsComponent implements OnInit {
  leagueService = inject(LeagueZoneService);
  drafts?: DraftGroup[];

  /** Pools the viewer has collapsed; every pool starts open. */
  private collapsed = new Set<string>();

  ngOnInit(): void {
    this.leagueService.getTeamsByDraft().subscribe((data) => {
      this.drafts = data.drafts;
    });
  }

  groupKey(group: DraftGroup): string {
    return group.draftSlug ?? '';
  }

  isOpen(group: DraftGroup): boolean {
    return !this.collapsed.has(this.groupKey(group));
  }

  toggle(group: DraftGroup): void {
    const key = this.groupKey(group);
    if (this.collapsed.has(key)) this.collapsed.delete(key);
    else this.collapsed.add(key);
  }
}

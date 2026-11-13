import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import {
  DashboardTeam,
  DashboardUpNext,
  isFuture,
  leagueLine,
  teamLinks,
} from '../dashboard.model';

type UpNextRow = {
  id: string;
  pick: boolean;
  icon: string;
  title: string;
  detail: string;
  when: string | null;
  action: { label: string; link: unknown[] };
};

function rowFor(item: DashboardUpNext, team: DashboardTeam): UpNextRow {
  const links = teamLinks(team);
  const where = `${team.teamName} · ${leagueLine(team)}`;
  const base = { id: `${item.kind}:${team.id}`, when: item.when };
  if (item.kind === 'pick') {
    const slot =
      team.draft?.round && team.draft.pick
        ? ` · Round ${team.draft.round}, Pick ${team.draft.pick}`
        : '';
    return {
      ...base,
      pick: true,
      icon: 'timer',
      title: "You're on the Clock",
      detail: `${where}${slot}`,
      action: { label: 'Make Your Pick', link: links.draft ?? links.page },
    };
  }
  if (item.kind === 'match') {
    const round = team.next?.round ?? 'Next Match';
    const opponent = team.next?.opponent?.name;
    return {
      ...base,
      pick: false,
      icon: 'swords',
      title: opponent ? `${round} vs ${opponent}` : round,
      detail: where,
      action: { label: 'Prep Matchup', link: links.matchup ?? links.page },
    };
  }
  return {
    ...base,
    pick: false,
    icon: 'format_list_numbered',
    title: 'Draft Starts',
    detail: where,
    action: { label: 'View Team', link: links.page },
  };
}

@Component({
  selector: 'pdz-dashboard-up-next',
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    CountdownComponent,
    IconComponent,
  ],
  templateUrl: './dashboard-up-next.component.html',
  styleUrl: './dashboard-up-next.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUpNextComponent {
  readonly items = input.required<DashboardUpNext[]>();
  readonly teams = input.required<DashboardTeam[]>();

  protected readonly isFuture = isFuture;

  protected readonly rows = computed(() => {
    const teams = new Map(this.teams().map((team) => [team.id, team]));
    return this.items().flatMap((item) => {
      const team = teams.get(item.teamId);
      return team ? [rowFor(item, team)] : [];
    });
  });
}
